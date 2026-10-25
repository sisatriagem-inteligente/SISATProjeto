import { IsNotEmpty, IsString } from 'class-validator';
import { IsRecoveryWord } from '../validators/recovery-words.validator';

export class CompleteRecoverySetupDto {
  @IsString()
  @IsNotEmpty()
  setupToken!: string;

  @IsRecoveryWord()
  recoveryWord1!: string;

  @IsRecoveryWord()
  recoveryWord2!: string;

  @IsRecoveryWord()
  recoveryWord3!: string;
}
