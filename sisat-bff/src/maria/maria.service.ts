import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Model, Types } from 'mongoose';
import { EnviarMensagemDto } from './dto/enviar-mensagem.dto';
import { ResultadoMariaDto } from '../triagens/dto/resultado-maria.dto';
import { TriagensService } from '../triagens/triagem.service';
import {
  AutorMensagemChat,
  Triagem,
  TriagemDocument,
  TriagemStatus,
} from '../triagens/schemas/triagem.schema';

type RespostaChat = { mensagem: string; finalizada: boolean };
type MensagemIA = { role: string; content: string };

@Injectable()
export class MariaService {
  private readonly mariaApiUrl = (
    process.env.MARIA_API_URL ?? 'http://127.0.0.1:8000'
  ).replace(/\/$/, '');
  // Uma requisição pode realizar duas chamadas locais ao modelo.
  private readonly timeoutMs = Number(process.env.MARIA_TIMEOUT_MS) || 360_000;
  // Evita processar simultaneamente a mesma conversa nesta instância do BFF.
  private readonly emProcessamento = new Set<string>();

  constructor(
    @InjectModel(Triagem.name)
    private readonly triagemModel: Model<TriagemDocument>,
    private readonly triagensService: TriagensService,
  ) {}

  async enviarMensagem(dto: EnviarMensagemDto) {
    const mensagem = dto.mensagem.trim();
    if (!Types.ObjectId.isValid(dto.triagem_id)) {
      throw new BadRequestException('O ID da triagem informado é inválido.');
    }
    if (!mensagem || mensagem.length > 4000) {
      throw new BadRequestException(
        'Envie uma mensagem de 1 a 4000 caracteres.',
      );
    }
    const id = new Types.ObjectId(dto.triagem_id).toHexString();
    if (this.emProcessamento.has(id)) {
      throw new ConflictException('Aguarde a resposta da mensagem anterior.');
    }
    this.emProcessamento.add(id);
    try {
      return await this.processar(id, mensagem);
    } finally {
      this.emProcessamento.delete(id);
    }
  }

  private async processar(id: string, mensagem: string) {
    const triagem = await this.triagemModel.findById(id).exec();
    if (!triagem) throw new NotFoundException('Triagem não encontrada.');
    if (
      triagem.status === TriagemStatus.CONCLUIDA ||
      triagem.medico_id ||
      triagem.chat_finalizado ||
      triagem.cor_classificacao
    ) {
      throw new BadRequestException(
        'Esta triagem não está aberta para novas mensagens.',
      );
    }
    const messages: MensagemIA[] = (triagem.mensagens ?? []).map((m) => ({
      role: m.autor === AutorMensagemChat.PACIENTE ? 'user' : 'assistant',
      content: m.texto,
    }));
    messages.push({ role: 'user', content: mensagem });
    if (messages.length > 100) {
      throw new BadRequestException(
        'Limite da conversa atingido. Procure a equipe de atendimento.',
      );
    }

    const chat = await this.chamarIA('/chat', id, messages);
    if (!this.chatValido(chat)) {
      throw new BadGatewayException(
        'A IA retornou uma resposta de chat inválida.',
      );
    }

    let resultado: ResultadoMariaDto | undefined;
    if (chat.finalizada) {
      // Usa exatamente o histórico encerrado pelo paciente; não inclui uma
      // mensagem do assistant afirmando fatos novos ou que a ficha foi salva.
      resultado = await this.validarResultado(
        await this.chamarIA('/triagem', id, messages),
      );
    }

    // Nenhuma mensagem/ficha é gravada se uma chamada ou validação falhar.
    // A persistência de mensagem, resposta e ficha final é uma única operação.
    await this.triagensService.salvarConversaMaria(
      id,
      triagem.__v ?? 0,
      [
        {
          autor: AutorMensagemChat.PACIENTE,
          texto: mensagem,
          enviada_em: new Date(),
        },
        {
          autor: AutorMensagemChat.MARIA,
          texto: chat.mensagem.trim(),
          enviada_em: new Date(),
        },
      ],
      resultado,
    );
    return { mensagem: chat.mensagem.trim(), finalizada: chat.finalizada };
  }

  private async chamarIA(
    rota: string,
    id: string,
    messages: MensagemIA[],
  ): Promise<unknown> {
    let resposta: Response;
    const signal = AbortSignal.timeout(this.timeoutMs);
    try {
      resposta = await fetch(this.mariaApiUrl + rota, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triagem_id: id, messages }),
        signal,
      });
    } catch {
      throw new ServiceUnavailableException(
        'A MarIA está indisponível ou demorou para responder.',
      );
    }
    if (!resposta.ok) {
      if (resposta.status === 422 || resposta.status === 502) {
        throw new BadGatewayException(
          'A IA não conseguiu validar a coleta. A mensagem não foi salva; tente novamente.',
        );
      }
      throw new ServiceUnavailableException(
        'A MarIA não conseguiu processar a mensagem.',
      );
    }
    try {
      return await resposta.json();
    } catch {
      if (signal.aborted) {
        throw new ServiceUnavailableException(
          'A MarIA demorou para responder.',
        );
      }
      throw new BadGatewayException('A MarIA retornou um JSON inválido.');
    }
  }

  private chatValido(valor: unknown): valor is RespostaChat {
    if (!valor || typeof valor !== 'object') return false;
    const r = valor as Record<string, unknown>;
    return (
      typeof r.mensagem === 'string' &&
      !!r.mensagem.trim() &&
      typeof r.finalizada === 'boolean'
    );
  }

  private async validarResultado(valor: unknown): Promise<ResultadoMariaDto> {
    if (!valor || typeof valor !== 'object' || Array.isArray(valor)) {
      throw new BadGatewayException('Ficha da IA inválida.');
    }
    const dados = this.limparTextos(valor) as Record<string, unknown>;
    const triagem = dados.dados_triagem;
    if (triagem && typeof triagem === 'object' && !Array.isArray(triagem)) {
      const campos = triagem as Record<string, unknown>;
      if (typeof campos.intensidade === 'string') {
        const intensidade = campos.intensidade.toLowerCase();
        campos.intensidade = intensidade === 'ligeira' ? 'leve' : intensidade;
      }
    }
    // O ValidationPipe HTTP não é executado em chamadas internas ao service.
    const dto = plainToInstance(ResultadoMariaDto, dados);
    const erros = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
    });
    if (
      erros.length ||
      !dto.dados_triagem?.sintomas?.length ||
      dto.dados_triagem.sintomas.some((s) => !s)
    ) {
      throw new BadGatewayException(
        'A ficha da IA não corresponde ao formato esperado; nada foi salvo.',
      );
    }
    return dto;
  }

  private limparTextos(valor: unknown): unknown {
    if (typeof valor === 'string') return valor.trim();
    if (Array.isArray(valor))
      return valor.map((item) => this.limparTextos(item));
    if (valor && typeof valor === 'object') {
      return Object.fromEntries(
        Object.entries(valor).map(([chave, item]) => [
          chave,
          this.limparTextos(item),
        ]),
      );
    }
    return valor;
  }
}
