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

  sub: string;

 
  email: string;

  
  role: UserRole;

  
  cpf?: string;

  
  iat?: number;

 
 
  exp?: number;
}

