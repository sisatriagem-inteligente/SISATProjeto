// Importa os validadores da biblioteca class-validator.
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';

/*
 * Define o formato dos dados esperados na rota:
 *
 * POST /auth/paciente/cadastro
 *
 * Corpo esperado:
 * {
 *   "cpf": "12345678901",
 *   "email": "paciente@email.com",
 *   "password": "123456"
 * }
 */
export class CadastroDto {
  /*
   * Impede que o CPF seja enviado vazio.
   */
  @IsNotEmpty({
    message: 'O CPF é obrigatório.',
  })

  /*
   * Garante que o CPF seja enviado como texto.
   *
   * Exemplo correto:
   * "12345678901"
   *
   * Exemplo incorreto:
   * 12345678901
   */
  @IsString({
    message: 'O CPF deve ser enviado como texto.',
  })

  /*
   * Exige que o CPF tenha exatamente 11 caracteres.
   *
   * O frontend remove pontos e hífen antes de enviar.
   */
  @Length(11, 11, {
    message: 'O CPF deve conter exatamente 11 dígitos.',
  })

  /*
   * Verifica se todos os caracteres do CPF são números.
   *
   * A expressão regular significa:
   *
   * ^       início do texto
   * \d{11}  exatamente 11 números
   * $       fim do texto
   */
  @Matches(/^\d{11}$/, {
    message: 'O CPF deve conter apenas números.',
  })
  cpf!: string;

  /*
   * Impede que o e-mail seja enviado vazio.
   */
  @IsNotEmpty({
    message: 'O e-mail é obrigatório.',
  })

  /*
   * Verifica se o valor possui um formato válido de e-mail.
   *
   * Exemplos válidos:
   * paciente@gmail.com
   * nome.sobrenome@email.com
   */
  @IsEmail(
    {},
    {
      message: 'Insira um e-mail válido.',
    },
  )
  email!: string;

  /*
   * Impede que a senha seja enviada vazia.
   */
  @IsNotEmpty({
    message: 'A senha é obrigatória.',
  })

  /*
   * Garante que a senha seja uma string.
   */
  @IsString({
    message: 'A senha deve ser um texto.',
  })

  /*
   * Exige uma senha com pelo menos seis caracteres.
   *
   * Essa validação ocorre antes de o bcrypt transformar
   * a senha em hash.
   */
  @MinLength(6, {
    message: 'A senha deve ter no mínimo 6 caracteres.',
  })
  password!: string;
}

/**o frontend envia password, no authservice é transformado em hash e salvo no mongodb como:
 * senha: hashedPassword
 */