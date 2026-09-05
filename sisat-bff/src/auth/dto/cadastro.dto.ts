// Importa os validadores da biblioteca class-validator.
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';

/**
 * Define e valida os dados recebidos no cadastro
 * de um paciente.
 *
 * Utilizado pela rota:
 * POST /auth/paciente/cadastro
 */
export class CadastroDto {
 /**
   * CPF do paciente.
   *
   * Deve ser enviado como texto, conter exatamente
   * 11 caracteres e possuir apenas números.
   *
   * O CPF deve chegar ao backend sem máscara.
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
   * E-mail utilizado pelo paciente.
   *
   * O campo é obrigatório e deve possuir
   * um formato válido de e-mail.
   */
  @IsNotEmpty({
    message: 'O e-mail é obrigatório.',
  })

 
  @IsEmail(
    {},
    {
      message: 'Insira um e-mail válido.',
    },
  )
  email!: string;

   /**
   * Senha informada durante o cadastro.
   *
   * Deve possuir pelo menos seis caracteres.
   * Antes de ser salva no banco, essa senha é
   * transformada em hash pelo AuthService.
   */
  @IsNotEmpty({
    message: 'A senha é obrigatória.',
  })

 
  @IsString({
    message: 'A senha deve ser um texto.',
  })

 
  @MinLength(6, {
    message: 'A senha deve ter no mínimo 6 caracteres.',
  })
  password!: string;
}

/**o frontend envia password, no authservice é transformado em hash e salvo no mongodb como:
 * senha: hashedPassword
 */