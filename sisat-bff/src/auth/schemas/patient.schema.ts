/*
 * Decorators e função utilizados para criar
 * um schema do Mongoose por meio do NestJS.
 */
import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';


import { HydratedDocument } from 'mongoose';

/**
 * Tipo que representa um documento de paciente retornado
 * pelo Mongoose.
 *
 * Além dos atributos definidos na classe Patient,
 * possui propriedades do documento do MongoDB, como o _id,
 * e métodos fornecidos pelo Mongoose.
 */
export type PatientDocument =
  HydratedDocument<Patient>;

/**
 * Representa um paciente armazenado no banco de dados.
 *
 * Esta classe define a estrutura dos documentos da coleção
 * "pacientes", utilizada principalmente no cadastro e
 * autenticação dos pacientes do SISAT.
 */
@Schema({
  collection: 'pacientes',
})
export class Patient {
   /**
   * CPF utilizado para identificar o paciente.
   *
   * É obrigatório e deve ser único no banco de dados,
   * impedindo o cadastro de dois pacientes com o mesmo CPF.
   */
  @Prop({
    required: true,
    unique: true,
    trim: true,
  })
  cpf!: string;

  /**
   * E-mail utilizado pelo paciente.
   *
   * O valor é obrigatório e único.
   * Antes de ser armazenado, o Mongoose converte o e-mail
   * para letras minúsculas e remove espaços nas extremidades.
   */
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email!: string;

 /**
   * Senha do paciente armazenada de forma protegida.
   *
   * O sistema não salva a senha original.
   * Antes do cadastro, o AuthService utiliza o bcrypt
   * para gerar um hash, que é armazenado neste campo.
   */
  @Prop({
    required: true,
  })
  senha!: string;
}

/**
 * Gera o schema do Mongoose a partir da classe Patient.
 *
 * O PatientSchema é posteriormente registrado no AuthModule,
 * permitindo que o NestJS injete o model de pacientes
 * no AuthService.
 */
export const PatientSchema =
  SchemaFactory.createForClass(Patient);




 