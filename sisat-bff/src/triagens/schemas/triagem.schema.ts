import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  HydratedDocument,
  Schema as MongooseSchema,
  Types,
} from 'mongoose';

import { Patient } from '../../auth/schemas/patient.schema';

export type TriagemDocument = HydratedDocument<Triagem>;

export enum TriagemStatus {
  INICIADA = 'iniciada',
  EM_ANDAMENTO = 'em_andamento',
  AGUARDANDO_ATENDIMENTO = 'aguardando_atendimento',
  EM_ATENDIMENTO = 'em_atendimento',
  CONCLUIDA = 'concluida',
  CANCELADA = 'cancelada',
}

/*
|--------------------------------------------------------------------------
| Dados do paciente coletados pela MarIA
|--------------------------------------------------------------------------
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

export const DadosPacienteSchema =
  SchemaFactory.createForClass(DadosPaciente);

/*
|--------------------------------------------------------------------------
| Dados da triagem coletados pela MarIA
|--------------------------------------------------------------------------
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

  @Prop({
    type: Number,
    default: null,
  })
  intensidade!: number | null;

  @Prop({
    type: [String],
    default: [],
  })
  informacoes_complementares!: string[];
}

export const DadosTriagemSchema =
  SchemaFactory.createForClass(DadosTriagem);

/*
|--------------------------------------------------------------------------
| Hipóteses Clínicas Iniciais
|--------------------------------------------------------------------------
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

export const HipoteseClinicaInicialSchema =
  SchemaFactory.createForClass(HipoteseClinicaInicial);

/*
|--------------------------------------------------------------------------
| Informações adicionadas pelo profissional de saúde
|--------------------------------------------------------------------------
*/

@Schema({ _id: false })
export class InformacoesMedicas {
  @Prop({
    type: Number,
    default: null,
  })
  temperatura!: number | null;

  @Prop({
    type: String,
    default: null,
  })
  pressao_arterial!: string | null;

  @Prop({
    type: Number,
    default: null,
  })
  frequencia_cardiaca!: number | null;

  @Prop({
    type: String,
    default: null,
  })
  exame_fisico!: string | null;

  @Prop({
    type: String,
    default: null,
  })
  observacoes!: string | null;
}

export const InformacoesMedicasSchema =
  SchemaFactory.createForClass(InformacoesMedicas);

/*
|--------------------------------------------------------------------------
| Triagem
|--------------------------------------------------------------------------
*/

@Schema({
  timestamps: true,
  collection: 'triagens',
})
export class Triagem {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: Patient.name,
    required: true,
  })
  paciente_id!: Types.ObjectId;

  @Prop({
    type: String,
    enum: TriagemStatus,
    default: TriagemStatus.INICIADA,
  })
  status!: TriagemStatus;

  @Prop({
    type: [MongooseSchema.Types.Mixed],
    default: [],
  })
  mensagens!: unknown[];

  @Prop({
    type: DadosPacienteSchema,
    default: () => ({}),
  })
  dados_paciente!: DadosPaciente;

  @Prop({
    type: DadosTriagemSchema,
    default: () => ({}),
  })
  dados_triagem!: DadosTriagem;

  @Prop({
    type: String,
    default: null,
  })
  resumo_triagem!: string | null;

  @Prop({
    type: [HipoteseClinicaInicialSchema],
    default: [],
  })
  hipoteses_clinicas_iniciais!: HipoteseClinicaInicial[];

  @Prop({
    type: InformacoesMedicasSchema,
    default: () => ({}),
  })
  informacoes_medicas!: InformacoesMedicas;
}

export const TriagemSchema =
  SchemaFactory.createForClass(Triagem);