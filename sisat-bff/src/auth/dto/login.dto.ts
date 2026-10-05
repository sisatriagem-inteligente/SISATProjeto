// Importa os validadores usados no login do paciente.
import {
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';

/**
 * Define e valida os dados recebidos durante
 * o login de um paciente.
 *
 * Utilizado pela rota:
 * POST /auth/paciente/login
 */
export class LoginDto {
  /**
   * CPF utilizado para identificar o paciente.
   *
   * Deve conter exatamente 11 números
   * e ser enviado sem máscara.
   */
  @IsNotEmpty({
    message: 'O CPF é obrigatório.',
  })

  
  @IsString({
    message: 'O CPF deve ser enviado como texto.',
  })

 
  @Length(11, 11, {
    message: 'O CPF deve conter exatamente 11 dígitos.',
  })

 
  @Matches(/^\d{11}$/, {
    message: 'O CPF deve conter apenas números.',
  })
  cpf!: string;

   /**
   * Senha informada pelo paciente para autenticação.
   *
   * O AuthService compara essa senha com o hash
   * armazenado no banco utilizando bcrypt.
   */
  @IsNotEmpty({
    message: 'A senha é obrigatória.',
  })

 
  @IsString({
    message: 'A senha deve ser um texto.',
  })
  password!: string;
}

/**
 * No login, a senha precisa apenas ser informada.
 * A validade é verificada por comparação com o hash.
 */