import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
  Schema as MongooseSchema,
  Types,
} from 'mongoose';

import { Patient } from '../../auth/schemas/patient.schema';
import { IntensidadeTriagem } from '../enums/intensidade-triagem.enum';
import { CorClassificacao } from '../enums/cor-classificacao.enum';
import { Doctor } from '../../auth/schemas/doctor.schema';

/**
 * Tipo que representa um documento de triagem
 * retornado pelo Mongoose.
 *
 * Além dos campos definidos na classe Triagem,
 * o documento possui propriedades do MongoDB,
 * como o _id, e métodos fornecidos pelo Mongoose.
 */

export type TriagemDocument =
  HydratedDocument<Triagem>;


  /**
 * Define os possíveis estados de uma triagem.
 *
 * A triagem permanece como "Aguardando" enquanto
 * o atendimento não for finalizado.
 * Quando o médico conclui o atendimento,
 * o status passa para "Concluida".
 */
export enum TriagemStatus {
  AGUARDANDO = 'Aguardando',
  CONCLUIDA = 'Concluida',
}

 


/**
 * Representa os dados básicos do paciente
 * coletados durante a conversa com a MarIA.
 *
 * Esta estrutura é armazenada dentro do documento
 * da própria triagem.
 */

@Schema({ _id: false })
export class DadosPaciente {
  @Prop({
    type: String,
    default: null,
  })
  nome!: string | null;

  @Prop({
    type: Number,
    default: null,
  })
  idade!: number | null;

  @Prop({
    type: String,
    default: null,
  })
  sexo!: string | null;
}

/**
 * Gera o sub-schema utilizado para armazenar
 * os dados do paciente dentro de uma triagem.
 */

export const DadosPacienteSchema =
  SchemaFactory.createForClass(DadosPaciente);

/**
 * Representa as informações coletadas pela MarIA
 * durante o processo de triagem.
 *
 * Esses dados descrevem a principal queixa,
 * sintomas, duração e intensidade relatados
 * pelo paciente.
 */

@Schema({ _id: false })
export class DadosTriagem {
  @Prop({
    type: String,
    default: null,
  })
  queixa_principal!: string | null;

  @Prop({
    type: [String],
    default: [],
  })
  sintomas!: string[];

  @Prop({
    type: String,
    default: null,
  })
  tempo_sintomas!: string | null;

  /**
   * Intensidade informada durante a triagem.
   *
   * Os valores possíveis são definidos pelo enum
   * IntensidadeTriagem: leve, moderada ou intensa.
   */
 
  @Prop({
    type: String,
    enum : Object.values(IntensidadeTriagem),
    default: null,
  })
  intensidade!: IntensidadeTriagem | null;




  @Prop({
    type: [String],
    default: [],
  })
  informacoes_complementares!: string[];
}

/**
 * Gera o sub-schema dos dados clínicos coletados
 * durante a triagem.
 */

export const DadosTriagemSchema =
  SchemaFactory.createForClass(DadosTriagem);

/**
 * Representa o resumo da triagem produzido
 * a partir das informações coletadas pela MarIA.
 */
@Schema({ _id: false })
export class ResumoTriagem {
  @Prop({
    type: String,
    default: null,
  })
  resumo!: string | null;
}
/**
 * Gera o sub-schema utilizado para armazenar
 * o resumo da triagem.
 */
export const ResumoTriagemSchema =
  SchemaFactory.createForClass(ResumoTriagem);
/**
 * Representa uma hipótese clínica inicial
 * apresentada após a triagem.
 *
 * Cada hipótese possui o nome da possível condição
 * e uma justificativa baseada nas informações coletadas.
 *
 * Essas informações são apenas hipóteses iniciais
 * e não representam um diagnóstico médico definitivo.
 */

@Schema({ _id: false })
export class HipoteseClinicaInicial {
  @Prop({
    type: String,
    required: true,
  })
  hipotese!: string;

  @Prop({
    type: String,
    required: true,
  })
  justificativa!: string;
}

/**
 * Gera o sub-schema utilizado para cada hipótese
 * clínica inicial armazenada na triagem.
 */

export const HipoteseClinicaInicialSchema =
  SchemaFactory.createForClass(
    HipoteseClinicaInicial,
  );

/**
 * Representa as informações registradas pelo médico
 * durante o atendimento.
 *
 * Esses dados não são preenchidos pela MarIA.
 * Eles são adicionados posteriormente pelo profissional
 * responsável pelo atendimento.
 */

@Schema({ _id: false })
export class InformacoesMedicas {
  @Prop({
    type: Number,
    default: null,
  })
  altura!: number | null;

  @Prop({
    type: Number,
    default: null,
  })
  peso!: number | null;

  @Prop({
    type: Number,
    default: null,
  })
  temperatura!: number | null;

  @Prop({
    type: Number,
    default: null,
  })
  frequencia_cardiaca!: number | null;

  @Prop({
    type: Number,
    default: null,
  })
  frequencia_respiratoria!: number | null;

  /*
   * Nome alinhado com o banco:
   * exame_fisico_direcionado
   */
  @Prop({
    type: String,
    default: null,
  })
  exame_fisico_direcionado!: string | null;

  @Prop({
    type: String,
    default: null,
  })
  observacoes!: string | null;
}

/**
 * Gera o sub-schema das informações adicionadas
 * pelo médico durante o atendimento.
 */

export const InformacoesMedicasSchema =
  SchemaFactory.createForClass(InformacoesMedicas);

/**
 * Identifica quem enviou uma mensagem no chat da triagem.
 */
export enum AutorMensagemChat {
  PACIENTE = 'paciente',
  MARIA = 'maria',
}

/**
 * Representa uma mensagem trocada entre o paciente
 * e a MarIA durante a triagem.
 */
@Schema({ _id: false })
export class MensagemChat {
  @Prop({
    type: String,
    enum: Object.values(AutorMensagemChat),
    required: true,
  })
  autor!: AutorMensagemChat;

  @Prop({
    type: String,
    required: true,
  })
  texto!: string;

  @Prop({
    type: Date,
    default: Date.now,
  })
  enviada_em!: Date;
}

export const MensagemChatSchema =
  SchemaFactory.createForClass(MensagemChat);

/**
 * Representa uma triagem armazenada no MongoDB.
 *
 * Este é o schema principal do módulo de triagens.
 * Ele reúne:
 *
 * - paciente responsável pela triagem;
 * - médico responsável pelo atendimento;
 * - dados enviados pela MarIA;
 * - classificação de prioridade;
 * - informações médicas;
 * - status e horários do atendimento.
 *
 * A opção timestamps cria automaticamente
 * os campos createdAt e updatedAt.
 */

@Schema({
  timestamps: true,
  collection: 'triagens',
})
export class Triagem {  //historico chat_bot tem que colocar ref
  /*
   * ID do paciente cadastrado.
   */

   /**
   * Referência ao paciente que iniciou a triagem.
   *
   * O valor armazenado corresponde ao _id de um
   * documento da coleção de pacientes.
   */
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Patient.name,
    required: true,
  })
  paciente_id!: Types.ObjectId;

   /**
   * Referência ao médico que assumiu o atendimento.
   *
   * Enquanto nenhum médico assumir a triagem,
   * o campo permanece como null.
   */

  

  @Prop({
  type: MongooseSchema.Types.ObjectId,
  ref: Doctor.name,
  default: null,
})
medico_id!: Types.ObjectId | null;

 /**
   * Registra o momento em que um médico iniciou
   * o atendimento desta triagem.
   */

@Prop({
  type: Date,
  default: null,
})
atendimento_iniciado_em!: Date | null;

/**
   * Registra o momento em que o atendimento
   * foi concluído.
   */

@Prop({
  type: Date,
  default: null,
})
atendimento_concluido_em!: Date | null;

  /**
   * Referência ao histórico da conversa realizada
   * durante a triagem.
   *
   * Atualmente o campo armazena apenas um ObjectId.
   * O relacionamento com um schema específico de
   * histórico poderá ser adicionado posteriormente.
   */
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    default: null,
  })
  historico_chat_id!: Types.ObjectId | null;

  /**
   * Histórico da conversa usado pelo BFF para enviar
   * o contexto completo à API da MarIA.
   */
  @Prop({
    type: [MensagemChatSchema],
    default: [],
  })
  mensagens!: MensagemChat[];

  // Finalizar a coleta não significa concluir o atendimento médico.
  @Prop({ type: Boolean, default: false })
  chat_finalizado!: boolean;

 /**
   * Classificação de prioridade da triagem.
   *
   * A cor é calculada pelo BFF a partir da intensidade:
   *
   * leve      -> verde
   * moderada  -> amarelo
   * intensa   -> vermelho
   */
  @Prop({
  type: String,
  enum: Object.values(CorClassificacao),
  default: null,
})
cor_classificacao!: CorClassificacao | null;

  /**
   * Data e hora em que a triagem entrou no sistema.
   *
   * Esse campo pode ser utilizado para ordenar pacientes
   * de mesma prioridade e para calcular o tempo de espera.
   */
  @Prop({
    type: Date,
    default: Date.now,
  })
  data_hora_entrada!: Date;

   /**
   * Estado atual da triagem.
   *
   * Os valores permitidos são:
   * - Aguardando
   * - Concluida
   */
  @Prop({
    type: String,
    enum: Object.values(TriagemStatus),
    default: TriagemStatus.AGUARDANDO,
  })
  status!: TriagemStatus;

   /**
   * Dados básicos do paciente coletados pela MarIA.
   */

  @Prop({
    type: DadosPacienteSchema,
    default: () => ({}),
  })
  dados_paciente!: DadosPaciente;


  /**
   * Informações relacionadas aos sintomas
   * e à queixa principal do paciente.
   */
  @Prop({
    type: DadosTriagemSchema,
    default: () => ({}),
  })
  dados_triagem!: DadosTriagem;

   /**
   * Resumo das informações coletadas durante a triagem.
   */

  @Prop({
    type: ResumoTriagemSchema,
    default: () => ({}),
  })
  resumo_triagem!: ResumoTriagem;

   /**
   * Lista de hipóteses clínicas iniciais
   * geradas a partir da triagem.
   */

  @Prop({
    type: [HipoteseClinicaInicialSchema],
    default: [],
  })
  hipoteses_clinicas_iniciais!: HipoteseClinicaInicial[];

   /**
   * Informações registradas pelo médico
   * durante o atendimento.
   */

  @Prop({
    type: InformacoesMedicasSchema,
    default: () => ({}),
  })
  informacoes_medicas!: InformacoesMedicas;

   /**
   * Campos gerados automaticamente pelo Mongoose
   * devido à opção timestamps: true.
   */
  createdAt!: Date;

  updatedAt!: Date;
}

/**
 * Gera o schema principal de triagem utilizado
 * pelo Mongoose para acessar a coleção "triagens".
 */
export const TriagemSchema =
  SchemaFactory.createForClass(Triagem);
