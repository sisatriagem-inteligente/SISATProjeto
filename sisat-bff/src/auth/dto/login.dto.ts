// Importa os validadores usados no login do paciente.
import {
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';

/*
 * Define os dados esperados na rota:
 *
 * POST /auth/paciente/login
 *
 * Corpo esperado:
 * {
 *   "cpf": "12345678901",
 *   "password": "123456"
 * }
 */
export class LoginDto {
  /*
   * Impede o envio de um CPF vazio.
   */
  @IsNotEmpty({
    message: 'O CPF é obrigatório.',
  })

  /*
   * Garante que o CPF seja uma string.
   */
  @IsString({
    message: 'O CPF deve ser enviado como texto.',
  })

  /*
   * Exige exatamente 11 caracteres.
   */
  @Length(11, 11, {
    message: 'O CPF deve conter exatamente 11 dígitos.',
  })

  /*
   * Garante que o CPF contenha apenas números.
   *
   * O CPF deve chegar sem máscara:
   * 12345678901
   *
   * E não:
   * 123.456.789-01
   */
  @Matches(/^\d{11}$/, {
    message: 'O CPF deve conter apenas números.',
  })
  cpf!: string;

  /*
   * Impede o envio de uma senha vazia.
   */
  @IsNotEmpty({
    message: 'A senha é obrigatória.',
  })

  /*
   * Garante que a senha recebida seja uma string.
   */
  @IsString({
    message: 'A senha deve ser um texto.',
  })
  password!: string;
}

/*Por que o login não possui @MinLength(6)?

Não é obrigatório validar o tamanho durante o login.

A senha já foi validada no cadastro. No login, o backend precisa apenas comparar a senha recebida com o hash armazenado:

bcrypt.compare(data.password, patient.senha);

Mesmo assim, adicionar @MinLength(6) também seria válido. Apenas não é necessário para o funcionamento.* */