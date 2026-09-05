/*
 * Decorators e função utilizados para criar
 * um schema do Mongoose com NestJS.
 */
import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

/*
 * Tipo que representa um documento completo de médico
 * retornado pelo Mongoose.
 */
import { HydratedDocument } from 'mongoose';

/**
 * Tipo que representa um documento de médico
 * retornado pelo Mongoose.
 *
 * Além dos atributos definidos na classe Doctor,
 * o documento possui propriedades do MongoDB,
 * como o _id, e métodos disponibilizados pelo Mongoose.
 */
export type DoctorDocument =
  HydratedDocument<Doctor>;

/**
 * Representa um médico armazenado no banco de dados.
 *
 * Este schema define a estrutura dos documentos
 * da coleção "medicos", utilizada na autenticação
 * dos médicos do SISAT.
 */
@Schema({
  collection: 'medicos',
})
export class Doctor {
 /**
   * E-mail institucional utilizado para identificar
   * e autenticar o médico.
   *
   * O campo é obrigatório, único e armazenado
   * em letras minúsculas, sem espaços nas extremidades.
   *
   * A validação do domínio institucional "@sisat.com"
   * é realizada em outras camadas da aplicação.
   */
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email!: string;

   /**
   * Senha do médico armazenada de forma protegida.
   *
   * O banco não deve armazenar a senha original.
   * Durante o login, o AuthService utiliza o bcrypt
   * para comparar a senha informada com o hash salvo
   * neste campo.
   */
  @Prop({
    required: true,
  })
  senha!: string;
}

/**
 * Gera o schema do Mongoose a partir da classe Doctor.
 *
 * O DoctorSchema é registrado nos módulos que precisam
 * acessar a coleção de médicos por meio do Mongoose.
 */
export const DoctorSchema =
  SchemaFactory.createForClass(Doctor);


 