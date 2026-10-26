// Importa os validadores da biblioteca class-validator.
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  MinLength,
  IsOptional,
} from 'class-validator';
import { IsCpf } from '../validators/is-cpf.validator';
import {
  IsStrongPassword,
  MaxPasswordBytes,
} from '../validators/password-strength.validator';
import { IsRecoveryWord } from '../validators/recovery-words.validator';

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
   * 11 caracteres, possuir apenas números e dígitos
   * verificadores válidos.
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
  @IsCpf()
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
   * Deve possuir pelo menos quinze caracteres e
   * apresentar força suficiente para o cadastro.
   * Antes de ser salva no banco, essa senha é
   * transformada em hash pelo AuthService.
   */

   //há três validadores: tamanho mínimo, limite em bytes e força.
  @IsNotEmpty({
    message: 'A senha é obrigatória.',
  })

 
  @IsString({
    message: 'A senha deve ser um texto.',
  })

 
  @MinLength(15, {
    message: 'A senha deve ter no mínimo 15 caracteres.',
  })
  @MaxPasswordBytes()
  @IsStrongPassword()
  password!: string;

  // O cadastro em duas etapas envia as respostas depois; se alguma for
  // enviada aqui, o service exige que as três sejam informadas juntas.
  @IsOptional()
  @IsRecoveryWord()
  recoveryWord1?: string;

  @IsOptional()
  @IsRecoveryWord()
  recoveryWord2?: string;

  @IsOptional()
  @IsRecoveryWord()
  recoveryWord3?: string;
}

/**
 * O frontend envia `password`. O AuthService gera o hash
 * e o armazena no campo `senha` do documento do paciente.
 */
