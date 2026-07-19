/*
 * Importa o enum que contém os perfis permitidos:
 *
 * paciente
 * medico
 */
import { UserRole } from '../enums/user-role.enum';

/*
 * Interface que define a estrutura do payload do JWT.
 *
 * O payload representa os dados armazenados
 * dentro do token depois do login.
 *
 * Esta interface existe apenas no TypeScript.
 * Ela não cria dados no banco e não altera o JWT
 * durante a execução.
 */
export interface JwtPayload {
  /*
   * "sub" significa subject.
   *
   * É uma propriedade padrão utilizada em JWT
   * para identificar a pessoa ou entidade à qual
   * o token pertence.
   *
   * No SISAT, recebe o _id do MongoDB.
   *
   * Exemplo:
   *
   * "66a123..."
   */
  sub: string;

  /*
   * E-mail do usuário autenticado.
   *
   * Tanto pacientes quanto médicos possuem e-mail,
   * por isso este campo é obrigatório.
   */
  email: string;

  /*
   * Perfil do usuário autenticado.
   *
   * Só aceita valores definidos no UserRole:
   *
   * UserRole.PACIENTE
   * UserRole.MEDICO
   *
   * Esse campo será utilizado futuramente para
   * controlar o acesso às rotas.
   */
  role: UserRole;

  /*
   * CPF do paciente.
   *
   * O símbolo ? indica que o campo é opcional.
   *
   * Pacientes terão CPF dentro do token.
   * Médicos não terão CPF, pois utilizam somente
   * e-mail institucional e senha.
   */
  cpf?: string;

  /*
   * "iat" significa issued at.
   *
   * Representa o momento em que o token foi criado.
   *
   * Esse valor é normalmente adicionado
   * automaticamente pela biblioteca JWT.
   */
  iat?: number;

  /*
   * "exp" significa expiration time.
   *
   * Representa quando o token deixará de ser válido.
   *
   * Como o AuthModule possui:
   *
   * expiresIn: '1d'
   *
   * o token expira um dia depois de sua criação.
   */
  exp?: number;
}

/*Exemplo de payload de paciente

Antes de o JWT ser assinado:

const payload: JwtPayload = {
  sub: String(patient._id),
  cpf: patient.cpf,
  email: patient.email,
  role: UserRole.PACIENTE,
};

Depois de assinado, o conteúdo do token será semelhante a:

{
  "sub": "66a123...",
  "cpf": "12345678901",
  "email": "paciente@gmail.com",
  "role": "paciente",
  "iat": 1780000000,
  "exp": 1780086400
}
Exemplo de payload médico
const payload: JwtPayload = {
  sub: String(doctor._id),
  email: doctor.email,
  role: UserRole.MEDICO,
};

Resultado aproximado:

{
  "sub": "66b456...",
  "email": "medico@sisat.com",
  "role": "medico",
  "iat": 1780000000,
  "exp": 1780086400
}
Por que cpf é opcional?

Porque a mesma interface serve para os dois perfis.

Paciente:

{
  sub,
  cpf,
  email,
  role
}

Médico:

{
  sub,
  email,
  role
}

Se o CPF não tivesse ?, o TypeScript obrigaria o token do médico a possuir CPF.

Por que iat e exp são opcionais?

Vocês não informam esses valores manualmente:

const payload = {
  sub,
  email,
  role,
};

O JwtService adiciona iat e exp ao assinar o token. Por isso, eles são opcionais na interface usada antes da assinatura. */