import { IsString, Matches } from 'class-validator';
import { IsCpf } from '../validators/is-cpf.validator';
import { IsRecoveryWord } from '../validators/recovery-words.validator';

/**
 * Dados da primeira etapa da recuperação de senha.
 * O paciente informa o CPF e uma resposta às perguntas fixas.
 * Usado por POST /auth/paciente/validar-resposta-recuperacao.
 */
export class ValidateRecoveryAnswerDto {
  @IsString()
  @Matches(/^\d{11}$/)
  @IsCpf()
  cpf!: string;

  @IsRecoveryWord()
  answer!: string;
}
