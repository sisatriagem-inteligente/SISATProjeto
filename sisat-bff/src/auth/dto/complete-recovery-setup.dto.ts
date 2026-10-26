import { IsNotEmpty, IsString } from 'class-validator';
import { IsRecoveryWord } from '../validators/recovery-words.validator';


/**
 * Dados enviados na segunda etapa do cadastro do paciente.
 * O setupToken autoriza configurar as três respostas sem
 * reenviar a senha usada na primeira etapa.
 */
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
