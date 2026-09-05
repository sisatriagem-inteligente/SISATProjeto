import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { CriarTriagemDto } from './dto/criar-triagem.dto';
import { TriagensService } from './triagem.service';
import { ResultadoMariaDto } from './dto/resultado-maria.dto';
import { IniciarAtendimentoDto } from './dto/iniciar-atendimento.dto';
import { InformacoesMedicasDto } from './dto/informacoes-medicas.dto';


/**
 * Controller responsável pelas rotas relacionadas
 * às triagens do SISAT.
 *
 * Todas as rotas desta classe utilizam
 * o prefixo /triagens.
 *
 * O controller recebe as requisições HTTP,
 * obtém parâmetros e dados do corpo da requisição
 * e encaminha o processamento para o TriagensService.
 */
@Controller('triagens')
export class TriagensController {

   /**
   * Injeta o service responsável pelas regras
   * de negócio das triagens.
   */
  constructor(
    private readonly triagensService: TriagensService,
  ) {}
  /**
   * Cria uma nova triagem para um paciente.
   *
   * Rota:
   * POST /triagens
   *
   * Neste momento é criada a estrutura inicial
   * da triagem. Os dados clínicos serão adicionados
   * posteriormente após o processamento da MarIA.
   */
  @Post()
  async criarTriagem(
    @Body() criarTriagemDto: CriarTriagemDto,
  ) {
    const triagem =
      await this.triagensService.criarTriagem(
        criarTriagemDto,
      );

         /**
     * Retorna apenas os dados necessários
     * para confirmar a criação da triagem.
     */
    return {
      message: 'Triagem criada com sucesso.',
      triagem: {
        id: triagem._id.toString(),
        paciente_id: triagem.paciente_id.toString(),
        status: triagem.status,
      },
    };
  }

   /**
   * Busca o histórico de triagens
   * de um determinado paciente.
   *
   * Rota:
   * GET /triagens/paciente/:paciente_id
   *
   * O paciente_id é recebido através
   * da própria URL.
   */

  @Get('paciente/:paciente_id')
async buscarTriagensDoPaciente(
  @Param('paciente_id') paciente_id: string,
) {
  return this.triagensService
    .buscarTriagensDoPaciente(paciente_id);
}

 /**
   * Busca as triagens disponíveis
   * na fila geral dos médicos.
   *
   * Rota:
   * GET /triagens/painel-medico
   */

@Get('painel-medico')
async buscarPainelMedico() {
  return this.triagensService
    .buscarPainelMedico();
}

 /**
   * Busca os atendimentos que já foram
   * assumidos por determinado médico.
   *
   * Rota:
   * GET /triagens/medico/:medico_id
   */

@Get('medico/:medico_id')
async buscarAtendimentosDoMedico(
  @Param('medico_id') medico_id: string,
) {
  return this.triagensService
    .buscarAtendimentosDoMedico(medico_id);
}

 /**
   * Busca os dados completos
   * de uma triagem específica.
   *
   * Rota:
   * GET /triagens/:id
   */

@Get(':id')
async buscarTriagemPorId(
  @Param('id') id: string,
) {
  return this.triagensService
    .buscarTriagemPorId(id);
}

  /**
   * Recebe e salva o resultado produzido
   * pela MarIA para uma triagem.
   *
   * Rota:
   * PATCH /triagens/:id/resultado-maria
   *
   * O ID da triagem vem pela URL e os dados
   * produzidos pela MarIA vêm no corpo
   * da requisição.
   */

@Patch(':id/resultado-maria')
async salvarResultadoMaria(
  @Param('id') id: string,
  @Body() resultadoMariaDto: ResultadoMariaDto,
) {
  const triagem =
    await this.triagensService.salvarResultadoMaria(
      id,
      resultadoMariaDto,
    );
 /**
     * Monta a resposta enviada após
     * a atualização da triagem.
     */
  return {
    message:
      'Resultado da MarIA salvo com sucesso.',

    triagem: {
      id: triagem._id.toString(),
      paciente_id:
        triagem.paciente_id.toString(),

      status: triagem.status,

      cor_classificacao:
        triagem.cor_classificacao,

      dados_paciente:
        triagem.dados_paciente,

      dados_triagem:
        triagem.dados_triagem,

      resumo_triagem:
        triagem.resumo_triagem,

      hipoteses_clinicas_iniciais:
        triagem.hipoteses_clinicas_iniciais,

      historico_chat_id:
        triagem.historico_chat_id?.toString() ??
        null,
    },
  };
}
  /**
   * Registra que um médico assumiu
   * determinada triagem.
   *
   * Rota:
   * PATCH /triagens/:id/iniciar-atendimento
   *
   * O ID da triagem vem pela URL,
   * enquanto o ID do médico é recebido
   * através do corpo da requisição.
   */

@Patch(':id/iniciar-atendimento')
async iniciarAtendimento(
  @Param('id') id: string,
  @Body()
  iniciarAtendimentoDto:
    IniciarAtendimentoDto,
) {
  const triagem =
    await this.triagensService
      .iniciarAtendimento(
        id,
        iniciarAtendimentoDto,
      );

  return {
    message: 'Atendimento iniciado com sucesso.',

    triagem: {
      id: triagem._id.toString(),

      medico_id:
        triagem.medico_id?.toString() ??
        null,

      paciente_id:
        triagem.paciente_id.toString(),

      status: triagem.status,

      atendimento_iniciado_em:
        triagem.atendimento_iniciado_em,
    },
  };
}

  /**
   * Salva informações registradas pelo médico
   * durante o atendimento.
   *
   * Rota:
   * PATCH /triagens/:id/informacoes-medicas
   *
   * O DTO permite que apenas alguns campos
   * sejam enviados em cada atualização.
   */

@Patch(':id/informacoes-medicas')
async salvarInformacoesMedicas(
  @Param('id') id: string,

  @Body()
  informacoesMedicasDto:
    InformacoesMedicasDto,
) {
  const triagem =
    await this.triagensService
      .salvarInformacoesMedicas(
        id,
        informacoesMedicasDto,
      );

  return {
    message:
      'Informações médicas salvas com sucesso.',

    triagem: {
      id: triagem._id.toString(),

      medico_id:
        triagem.medico_id?.toString() ??
        null,

      status: triagem.status,

      informacoes_medicas:
        triagem.informacoes_medicas,

      updatedAt: triagem.updatedAt,
    },
  };
}

  /**
   * Finaliza o atendimento de uma triagem.
   *
   * Rota:
   * PATCH /triagens/:id/concluir
   *
   * As verificações necessárias e a mudança
   * de status são realizadas pelo service.
   */

@Patch(':id/concluir')
async concluirAtendimento(
  @Param('id') id: string,
) {
  const triagem =
    await this.triagensService
      .concluirAtendimento(id);

  return {
    message:
      'Atendimento concluído com sucesso.',

    triagem: {
      id: triagem._id.toString(),

      paciente_id:
        triagem.paciente_id.toString(),

      medico_id:
        triagem.medico_id?.toString() ??
        null,

      status: triagem.status,

      atendimento_iniciado_em:
        triagem.atendimento_iniciado_em,

      atendimento_concluido_em:
        triagem.atendimento_concluido_em,
    },
  };
}


}
