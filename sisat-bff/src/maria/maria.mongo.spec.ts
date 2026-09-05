/**
 * Banco real isolado. Não usa BD_SISAT nem remove coleções/bancos.
 * Execute com SISAT_TEST_MONGO=1. Remove somente os IDs criados nesta execução.
 */
import { ConflictException } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { MariaController } from './maria.controller';
import { createConnection, Connection, Model, Types } from 'mongoose';
import { MariaService } from './maria.service';
import { TriagensService } from '../triagens/triagem.service';
import {
  Triagem,
  TriagemSchema,
  TriagemDocument,
  AutorMensagemChat,
} from '../triagens/schemas/triagem.schema';
import { DoctorDocument } from '../auth/schemas/doctor.schema';
import { PatientDocument } from '../auth/schemas/patient.schema';

const suite = process.env.SISAT_TEST_MONGO === '1' ? describe : describe.skip;
suite('Integração com MongoDB isolado', () => {
  let connection: Connection;
  let model: Model<Triagem>;
  let triagens: TriagensService;
  let maria: MariaService;
  const ids: Types.ObjectId[] = [];
  beforeAll(async () => {
    connection = await createConnection(
      'mongodb://127.0.0.1:27017/sisat_integracao_codex_teste',
      { serverSelectionTimeoutMS: 3000 },
    ).asPromise();
    model = connection.model(Triagem.name, TriagemSchema);
    triagens = new TriagensService(
      model as unknown as Model<TriagemDocument>,
      {} as Model<DoctorDocument>,
      {} as Model<PatientDocument>,
    );
    maria = new MariaService(
      model as unknown as Model<TriagemDocument>,
      triagens,
    );
  });
  afterEach(() => jest.restoreAllMocks());
  afterAll(async () => {
    if (model && ids.length) await model.deleteMany({ _id: { $in: ids } });
    if (connection) await connection.close();
  });
  async function criar() {
    const doc = await model.create({ paciente_id: new Types.ObjectId() });
    ids.push(doc._id);
    return doc;
  }
  const resultado = {
    dados_paciente: { nome: 'Paciente fictício', idade: 18, sexo: 'masculino' },
    dados_triagem: {
      queixa_principal: 'Febre',
      sintomas: ['febre'],
      tempo_sintomas: '2 dias',
      intensidade: 'leve',
      informacoes_complementares: [],
    },
    resumo_triagem: { resumo: 'Relato fictício de febre.' },
    hipoteses_clinicas_iniciais: [],
  };
  const testeReal = process.env.SISAT_TEST_IA === '1' ? it : it.skip;
  testeReal(
    'HTTP BFF -> FastAPI -> Ollama -> MongoDB com relato fictício',
    async () => {
      const doc = await criar();
      const modulo = await Test.createTestingModule({
        controllers: [MariaController],
        providers: [{ provide: MariaService, useValue: maria }],
      }).compile();
      const app = modulo.createNestApplication();
      app.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
        }),
      );
      await app.init();
      try {
        const resposta = await request(app.getHttpServer())
          .post('/maria/mensagem')
          .send({
            triagem_id: String(doc._id),
            mensagem:
              'Meu nome é João, tenho 18 anos, sexo masculino. Estou com febre há dois dias, de intensidade leve.',
          });
        console.log(
          'Resposta real BFF:',
          resposta.status,
          JSON.stringify(resposta.body),
        );
        expect(resposta.status).toBe(201);
        expect(resposta.body.finalizada).toBe(true);
        const salvo = await model.findById(doc._id).orFail();
        expect(salvo.chat_finalizado).toBe(true);
        expect(salvo.mensagens).toHaveLength(2);
        expect(salvo.cor_classificacao).toBe('verde');
        expect(salvo.dados_paciente.idade).toBe(18);
      } finally {
        await app.close();
      }
    },
    780_000,
  );
  testeReal(
    'dois turnos reais preservam histórico e finalizam a ficha',
    async () => {
      const doc = await criar();
      const primeira = await maria.enviarMensagem({
        triagem_id: String(doc._id),
        mensagem:
          'Meu nome é Lucas, tenho 25 anos, sexo masculino. Estou com dor de cabeça.',
      });
      console.log('Primeiro turno real:', JSON.stringify(primeira));
      expect(primeira.finalizada).toBe(false);
      const segunda = await maria.enviarMensagem({
        triagem_id: String(doc._id),
        mensagem:
          'Os sintomas começaram há três horas e a intensidade é moderada.',
      });
      console.log('Segundo turno real:', JSON.stringify(segunda));
      expect(segunda.finalizada).toBe(true);
      const salvo = await model.findById(doc._id).orFail();
      expect(salvo.mensagens).toHaveLength(4);
      expect(salvo.dados_paciente.nome).toBe('Lucas');
      expect(salvo.dados_paciente.idade).toBe(25);
      expect(salvo.dados_triagem.intensidade).toBe('moderada');
      expect(salvo.cor_classificacao).toBe('amarelo');
      expect(salvo.status).toBe('Aguardando');
    },
    780_000,
  );

  it('grava histórico, ficha e cor e mantém atendimento Aguardando', async () => {
    const doc = await criar();
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            mensagem: 'Qual a intensidade?',
            finalizada: false,
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ mensagem: 'Coleta concluída.', finalizada: true }),
        ),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify(resultado)));
    await maria.enviarMensagem({
      triagem_id: String(doc._id),
      mensagem: 'Tenho febre.',
    });
    await maria.enviarMensagem({
      triagem_id: String(doc._id),
      mensagem: 'Leve.',
    });
    const salvo = await model.findById(doc._id).orFail();
    expect(salvo.mensagens).toHaveLength(4);
    expect(salvo.chat_finalizado).toBe(true);
    expect(salvo.cor_classificacao).toBe('verde');
    expect(salvo.status).toBe('Aguardando');
    expect(salvo.__v).toBe(2);
    const consulta = await triagens.buscarTriagemPorId(String(doc._id));
    expect(consulta.triagem.chat_finalizado).toBe(true);
  });
  it('erro na ficha não grava mensagem nem conclusão no banco', async () => {
    const doc = await criar();
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ mensagem: 'Fim.', finalizada: true })),
      )
      .mockResolvedValueOnce(new Response('{}'));
    await expect(
      maria.enviarMensagem({ triagem_id: String(doc._id), mensagem: 'Teste' }),
    ).rejects.toThrow();
    const salvo = await model.findById(doc._id).orFail();
    expect(salvo.mensagens).toHaveLength(0);
    expect(salvo.chat_finalizado).toBe(false);
    expect(salvo.cor_classificacao).toBeNull();
  });
  it('rejeita versão antiga sem duplicar turno', async () => {
    const doc = await criar();
    const mensagens = [
      {
        autor: AutorMensagemChat.PACIENTE,
        texto: 'Teste',
        enviada_em: new Date(),
      },
    ];
    await triagens.salvarConversaMaria(String(doc._id), 0, mensagens);
    await expect(
      triagens.salvarConversaMaria(String(doc._id), 0, mensagens),
    ).rejects.toBeInstanceOf(ConflictException);
    expect((await model.findById(doc._id).orFail()).mensagens).toHaveLength(1);
  });
});
