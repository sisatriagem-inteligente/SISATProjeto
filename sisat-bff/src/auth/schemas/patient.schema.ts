/*
 * Decorators e função utilizados para criar
 * um schema do Mongoose por meio do NestJS.
 */
import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

/*
 * HydratedDocument representa um documento completo
 * retornado pelo Mongoose.
 *
 * Além dos campos definidos na classe, o documento
 * também possui propriedades como:
 *
 * _id
 * createdAt
 * updatedAt
 *
 * e métodos internos do Mongoose.
 */
import { HydratedDocument } from 'mongoose';

/*
 * Define o tipo TypeScript dos documentos de paciente
 * retornados pelo MongoDB.
 *
 * Esse tipo é utilizado no AuthService:
 *
 * Model<PatientDocument>
 */
export type PatientDocument =
  HydratedDocument<Patient>;

/*
 * Transforma a classe Patient em um schema do Mongoose.
 *
 * timestamps: true
 * adiciona automaticamente os campos:
 *
 * createdAt
 * updatedAt
 *
 * collection: 'pacientes'
 * define explicitamente o nome da coleção usada
 * no MongoDB.
 */
@Schema({
  collection: 'pacientes',
})
export class Patient {
  /*
   * CPF do paciente.
   *
   * required: true
   * torna o campo obrigatório no MongoDB.
   *
   * unique: true
   * cria um índice único para impedir dois documentos
   * com o mesmo CPF.
   *
   * trim: true
   * remove espaços no começo e no final do valor.
   */
  @Prop({
    required: true,
    unique: true,
    trim: true,
  })
  cpf!: string;

  /*
   * E-mail do paciente.
   *
   * required: true
   * torna o e-mail obrigatório.
   *
   * unique: true
   * impede que dois pacientes utilizem o mesmo e-mail.
   *
   * lowercase: true
   * transforma o e-mail em letras minúsculas antes
   * de armazená-lo.
   *
   * trim: true
   * remove espaços extras.
   *
   * Exemplo recebido:
   *
   * "  PACIENTE@GMAIL.COM  "
   *
   * Valor armazenado:
   *
   * "paciente@gmail.com"
   */
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email!: string;

  /*
   * Senha protegida do paciente.
   *
   * Este campo não armazena a senha original.
   * Ele armazena o hash criado pelo bcrypt.
   *
   * Exemplo:
   *
   * $2b$10$h1Q...
   *
   * O frontend envia o campo "password", mas o
   * AuthService converte e salva no campo "senha".
   */
  @Prop({
    required: true,
  })
  senha!: string;
}

/*
 * Converte a classe Patient em um schema que pode
 * ser registrado no MongooseModule.
 *
 * O PatientSchema é registrado no AuthModule.
 */
export const PatientSchema =
  SchemaFactory.createForClass(Patient);




  /**
   * 
   * Como esse schema é utilizado

No AuthModule:

MongooseModule.forFeature([
  {
    name: Patient.name,
    schema: PatientSchema,
  },
]);

No AuthService:

@InjectModel(Patient.name)
private readonly patientModel: Model<PatientDocument>

Depois, o model pode executar operações como:

this.patientModel.findOne({ cpf });
this.patientModel.create({
  cpf,
  email,
  senha: hashedPassword,
});
Documento gerado no MongoDB

Um novo paciente ficará aproximadamente assim:

{
  "_id": "ObjectId(...)",
  "cpf": "12345678901",
  "email": "paciente@gmail.com",
  "senha": "$2b$10$...",
  "createdAt": "2026-07-11T...",
  "updatedAt": "2026-07-11T..."
}
   */









/**Diferença entre Patient e PatientDocument

A classe:

export class Patient

representa os campos definidos por vocês:

cpf
email
senha

Já:

PatientDocument

representa o documento completo do Mongoose, incluindo:

_id
createdAt
updatedAt
métodos internos do documento

O mesmo vale para:

Doctor
DoctorDocument
Observação sobre unique: true

Este trecho:

unique: true

cria um índice único no MongoDB. Ele ajuda a impedir documentos duplicados.

Mesmo assim, é correto manter no AuthService as verificações:

const cpfExiste = await this.patientModel.findOne({ cpf });

e:

const emailExiste = await this.patientModel.findOne({ email });

Essas consultas permitem devolver mensagens mais claras para o frontend:

Este CPF já está cadastrado.
Este e-mail já está cadastrado.

O índice único continua servindo como uma proteção adicional no próprio banco.

Pequena melhoria opcional

Para impedir que o hash da senha seja retornado acidentalmente em consultas futuras, é possível usar:

@Prop({
  required: true,
  select: false,
})
senha!: string;

Porém, isso exigiria alterar os logins para buscar explicitamente a senha:

.findOne({ cpf })
.select('+senha')

Como o código atual já evita retornar a senha manualmente e está funcionando, não recomendo adicionar essa complexidade agora. */