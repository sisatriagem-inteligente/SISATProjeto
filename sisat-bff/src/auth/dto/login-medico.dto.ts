// Importa os validadores necessários para o login médico.
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
} from 'class-validator';

/**
 * Define e valida os dados recebidos durante
 * o login de um médico.
 *
 * Utilizado pela rota:
 * POST /auth/medico/login
 */
export class LoginMedicoDto {
  /**
   * E-mail institucional do médico.
   *
   * Além de possuir um formato válido de e-mail,
   * deve obrigatoriamente utilizar o domínio
   * institucional @sisat.com.
   */
  @IsNotEmpty({
    message: 'O e-mail institucional é obrigatório.',
  })

  /*
   * Verifica se o valor possui formato válido de e-mail.
   */
  @IsEmail(
    {},
    {
      message: 'Insira um e-mail válido.',
    },
  )

  @Matches(/^[^\s@]+@sisat\.com$/i, {
    message: 'O médico deve utilizar um e-mail @sisat.com.',
  })
  email!: string;

   /**
   * Senha informada pelo médico.
   *
   * Durante a autenticação, o AuthService compara
   * esse valor com o hash armazenado no banco.
   */
  @IsNotEmpty({
    message: 'A senha é obrigatória.',
  })

  
  @IsString({
    message: 'A senha deve ser um texto.',
  })
  password!: string;
}

