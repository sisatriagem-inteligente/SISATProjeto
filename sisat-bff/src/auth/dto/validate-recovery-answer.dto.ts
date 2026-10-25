import { IsString, Matches } from 'class-validator';
import { IsCpf } from '../validators/is-cpf.validator';
import { IsRecoveryWord } from '../validators/recovery-words.validator';

export class ValidateRecoveryAnswerDto {
  @IsString()
  @Matches(/^\d{11}$/)
  @IsCpf()
  cpf!: string;

  @IsRecoveryWord()
  answer!: string;
}
