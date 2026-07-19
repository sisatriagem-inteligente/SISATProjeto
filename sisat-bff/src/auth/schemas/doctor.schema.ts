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

/*
 * Define o tipo dos documentos da coleção "medicos".
 *
 * Esse tipo é usado no AuthService:
 *
 * Model<DoctorDocument>
 */
export type DoctorDocument =
  HydratedDocument<Doctor>;

/*
 * Transforma a classe Doctor em um schema do Mongoose.
 *
 * timestamps: true
 * adiciona automaticamente:
 *
 * createdAt
 * updatedAt
 *
 * collection: 'medicos'
 * define a coleção utilizada no banco BD_SISAT.
 */
@Schema({
  collection: 'medicos',
})
export class Doctor {
  /*
   * E-mail institucional do médico.
   *
   * required: true
   * torna o campo obrigatório.
   *
   * unique: true
   * impede dois médicos com o mesmo e-mail.
   *
   * lowercase: true
   * salva o e-mail em letras minúsculas.
   *
   * trim: true
   * remove espaços no início e no final.
   *
   * A regra que exige @sisat.com não está no schema.
   * Ela é validada pelo LoginMedicoDto e reforçada
   * pelo AuthService.
   */
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email!: string;

  /*
   * Hash da senha do médico.
   *
   * A senha original não deve ser armazenada.
   *
   * Durante o login, o AuthService utiliza:
   *
   * bcrypt.compare(data.password, doctor.senha)
   */
  @Prop({
    required: true,
  })
  senha!: string;
}

/*
 * Converte a classe Doctor em um schema do Mongoose.
 *
 * Esse schema será registrado no AuthModule.
 */
export const DoctorSchema =
  SchemaFactory.createForClass(Doctor);


  /**Como esse schema é utilizado

No AuthModule:

MongooseModule.forFeature([
  {
    name: Doctor.name,
    schema: DoctorSchema,
  },
]);

No AuthService:

@InjectModel(Doctor.name)
private readonly doctorModel: Model<DoctorDocument>

No login:

const doctor = await this.doctorModel
  .findOne({ email })
  .exec();
Documento médico no MongoDB
{
  "_id": "ObjectId(...)",
  "email": "medico@sisat.com",
  "senha": "$2b$10$...",
  "createdAt": "2026-07-11T...",
  "updatedAt": "2026-07-11T..."
}

O médico não possui CPF nem CRM porque, na versão atual do SISAT, sua autenticação é feita apenas com:

e-mail @sisat.com + senha */