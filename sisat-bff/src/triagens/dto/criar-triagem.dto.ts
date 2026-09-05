import { IsMongoId, IsNotEmpty } from 'class-validator';
/**
 * Define e valida os dados necessários
 * para criar uma nova triagem.
 *
 * Utilizado pela rota:
 * POST /triagens
 */
export class CriarTriagemDto {

  /**
   * Identificador do paciente que está
   * iniciando a triagem.
   *
   * Deve ser um ObjectId válido do MongoDB.
   */
  @IsNotEmpty()
  @IsMongoId()
  paciente_id!: string;
}