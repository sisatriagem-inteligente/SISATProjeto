import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { MariaService } from './maria.service';
import { TriagensService } from '../triagens/triagem.service';
import { TriagemDocument } from '../triagens/schemas/triagem.schema';

const id = '507f1f77bcf86cd799439011';
const ficha = () => ({
  dados_paciente: { nome: 'João', idade: 18, sexo: 'masculino' },
  dados_triagem: {
    queixa_principal: 'Febre',
    sintomas: ['Febre'],
    tempo_sintomas: 'há dois dias',
    intensidade: 'leve',
    informacoes_complementares: [],
  },
  resumo_triagem: { resumo: 'Paciente relata febre.' },
  hipoteses_clinicas_iniciais: [],
});

describe('MariaService: conversa e ficha separadas', () => {
  let service: MariaService;
  let documento: Record<string, unknown>;
  let findById: jest.Mock;
  let salvarConversaMaria: jest.Mock;
  let http: jest.SpyInstance;
  const enviar = () =>
    service.enviarMensagem({ triagem_id: id, mensagem: 'Estou com febre.' });
  const responde = (body: unknown, status = 200) =>
    http.mockResolvedValueOnce(new Response(JSON.stringify(body), { status }));

  beforeEach(() => {
    documento = {
      __v: 0,
      status: 'Aguardando',
      medico_id: null,
      chat_finalizado: false,
      cor_classificacao: null,
      mensagens: [],
    };
    findById = jest.fn(() => ({
      exec: jest.fn().mockResolvedValue(documento),
    }));
    salvarConversaMaria = jest.fn().mockResolvedValue({});
    service = new MariaService(
      { findById } as unknown as Model<TriagemDocument>,
      { salvarConversaMaria } as unknown as TriagensService,
    );
    http = jest.spyOn(globalThis, 'fetch');
  });
  afterEach(() => jest.restoreAllMocks());

  it('chama apenas /chat durante a coleta e salva o turno', async () => {
    responde({ mensagem: 'Há quanto tempo?', finalizada: false });
    await expect(enviar()).resolves.toEqual({
      mensagem: 'Há quanto tempo?',
      finalizada: false,
    });
    expect(http).toHaveBeenCalledTimes(1);
    expect(http.mock.calls[0][0]).toMatch(/\/chat$/);
    expect(salvarConversaMaria).toHaveBeenCalledWith(
      id,
      0,
      expect.any(Array),
      undefined,
    );
  });

  it('envia o histórico anterior e chama /triagem somente ao finalizar', async () => {
    documento.mensagens = [
      { autor: 'paciente', texto: 'Meu nome é João' },
      { autor: 'maria', texto: 'Quais sintomas?' },
    ];
    responde({ mensagem: 'Coleta concluída.', finalizada: true });
    responde(ficha());
    await expect(enviar()).resolves.toHaveProperty('finalizada', true);
    expect(http.mock.calls[1][0]).toMatch(/\/triagem$/);
    const primeiro = JSON.parse(http.mock.calls[0][1].body as string) as {
      messages: unknown[];
    };
    expect(primeiro.messages).toHaveLength(3);
    expect(http.mock.calls[1][1].body).toBe(http.mock.calls[0][1].body);
    expect(salvarConversaMaria).toHaveBeenCalledTimes(1);
    expect(salvarConversaMaria.mock.calls[0][3]).toMatchObject(ficha());
  });

  it.each(['idade', 'intensidade', 'resumo', 'ausente', 'extra'])(
    'rejeita ficha inválida: %s sem salvar mensagens',
    async (tipo) => {
      const resultado = ficha();
      if (tipo === 'idade') resultado.dados_paciente.idade = 131;
      if (tipo === 'intensidade')
        resultado.dados_triagem.intensidade = 'desconhecida';
      if (tipo === 'resumo') resultado.resumo_triagem.resumo = '   ';
      responde({ mensagem: 'Fim', finalizada: true });
      responde(
        tipo === 'ausente'
          ? {}
          : tipo === 'extra'
            ? { ...resultado, cor: 'verde' }
            : resultado,
      );
      await expect(enviar()).rejects.toBeInstanceOf(BadGatewayException);
      expect(salvarConversaMaria).not.toHaveBeenCalled();
    },
  );

  it('normaliza Ligeira para leve', async () => {
    const resultado = ficha();
    resultado.dados_triagem.intensidade = ' Ligeira ';
    responde({ mensagem: 'Fim', finalizada: true });
    responde(resultado);
    await enviar();
    expect(salvarConversaMaria.mock.calls[0][3].dados_triagem.intensidade).toBe(
      'leve',
    );
  });

  it('falha da segunda chamada não salva nem encerra e permite tentar novamente', async () => {
    responde({ mensagem: 'Fim', finalizada: true });
    http.mockRejectedValueOnce(new Error('timeout'));
    await expect(enviar()).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(salvarConversaMaria).not.toHaveBeenCalled();
    responde({ mensagem: 'Há quanto tempo?', finalizada: false });
    await expect(enviar()).resolves.toHaveProperty('finalizada', false);
  });

  it.each([
    {},
    { mensagem: ' ', finalizada: false },
    { mensagem: 'Oi', finalizada: 'sim' },
  ])('rejeita chat inválido', async (body) => {
    responde(body);
    await expect(enviar()).rejects.toBeInstanceOf(BadGatewayException);
    expect(salvarConversaMaria).not.toHaveBeenCalled();
  });

  it('rejeita JSON inválido', async () => {
    http.mockResolvedValueOnce(new Response('não é JSON'));
    await expect(enviar()).rejects.toBeInstanceOf(BadGatewayException);
    expect(salvarConversaMaria).not.toHaveBeenCalled();
  });

  it.each([422, 502, 503])('trata HTTP %s sem salvar', async (status) => {
    responde({}, status);
    await expect(enviar()).rejects.toBeInstanceOf(
      status === 503 ? ServiceUnavailableException : BadGatewayException,
    );
    expect(salvarConversaMaria).not.toHaveBeenCalled();
  });

  it('rejeita triagem inexistente', async () => {
    findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
    await expect(enviar()).rejects.toBeInstanceOf(NotFoundException);
  });

  it.each([
    { chat_finalizado: true },
    { status: 'Concluida' },
    { medico_id: new Types.ObjectId() },
    { cor_classificacao: 'verde' },
  ])('bloqueia conversa encerrada/atendimento iniciado', async (campos) => {
    Object.assign(documento, campos);
    await expect(enviar()).rejects.toBeInstanceOf(BadRequestException);
    expect(http).not.toHaveBeenCalled();
  });

  it('rejeita mensagem vazia e id inválido antes da IA', async () => {
    await expect(
      service.enviarMensagem({ triagem_id: id, mensagem: ' ' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.enviarMensagem({ triagem_id: 'x', mensagem: 'oi' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(http).not.toHaveBeenCalled();
  });

  it('bloqueia requisições simultâneas da mesma conversa', async () => {
    let liberar!: (r: Response) => void;
    http.mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        liberar = resolve;
      }),
    );
    const primeira = enviar();
    await expect(enviar()).rejects.toBeInstanceOf(ConflictException);
    liberar(
      new Response(JSON.stringify({ mensagem: 'Oi', finalizada: false })),
    );
    await primeira;
  });
});
