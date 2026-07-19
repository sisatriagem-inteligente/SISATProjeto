// Importa os validadores necessários para o login médico.
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
} from 'class-validator';

/*
 * Define o formato dos dados esperados na rota:
 *
 * POST /auth/medico/login
 *
 * Corpo esperado:
 * {
 *   "email": "medico@sisat.com",
 *   "password": "senha-do-medico"
 * }
 */
export class LoginMedicoDto {
  /*
   * Impede que o e-mail institucional seja enviado vazio.
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

  /*
   * Garante que o e-mail termine exatamente em @sisat.com.
   *
   * Expressão:
   *
   * ^           início do texto
   * [^\s@]+     um ou mais caracteres que não sejam
   *             espaço ou arroba
   * @sisat      domínio institucional
   * \.com       final .com
   * $           fim do texto
   * i           ignora diferença entre maiúsculas
   *             e minúsculas
   *
   * Exemplos aceitos:
   * medico@sisat.com
   * joao.silva@sisat.com
   * MEDICO@SISAT.COM
   *
   * Exemplos rejeitados:
   * medico@gmail.com
   * medico@sisat.com.br
   * medico@outlook.com
   */
  @Matches(/^[^\s@]+@sisat\.com$/i, {
    message: 'O médico deve utilizar um e-mail @sisat.com.',
  })
  email!: string;

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

/*O que significa !:?

Nos três DTOs existem propriedades como:

cpf!: string;
email!: string;
password!: string;

O símbolo ! informa ao TypeScript:

“Essa propriedade será preenchida depois, mesmo que não seja inicializada no construtor.”

Isso é comum em DTOs do NestJS, pois os valores são preenchidos automaticamente quando o JSON da requisição é transformado na classe.* */