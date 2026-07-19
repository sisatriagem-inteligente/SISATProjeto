import { IsMongoId, IsNotEmpty } from 'class-validator';

export class CriarTriagemDto {
  @IsNotEmpty()
  @IsMongoId()
  paciente_id!: string;
}