import { IsString, Matches } from 'class-validator';
import { IsCpf } from '../validators/is-cpf.validator';
import { IsRecoveryWord } from '../validators/recovery-words.validator';

/**
 * Dados para configurar ou substituir as respostas de recuperação
 * quando o paciente ainda sabe sua senha atual.
 * Usado por POST /auth/paciente/configurar-recuperacao.
 */
export class SetupRecoveryDto {
  @IsString()
  @Matches(/^\d{11}$/)
  @IsCpf()
  cpf!: string;

  @IsString()
  currentPassword!: string;

  @IsRecoveryWord()
  recoveryWord1!: string;

  @IsRecoveryWord()
  recoveryWord2!: string;

  @IsRecoveryWord()
  recoveryWord3!: string;
}
