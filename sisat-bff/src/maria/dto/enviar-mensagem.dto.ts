import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

/**
 * Dados enviados pelo frontend a cada mensagem do chat.
 */
export class EnviarMensagemDto {
  @IsMongoId()
  triagem_id!: string;

  @IsString()
  @IsNotEmpty()
  mensagem!: string;
}
