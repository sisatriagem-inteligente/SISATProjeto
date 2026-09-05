import {
  IsMongoId,
  IsNotEmpty,
} from 'class-validator';
/**
 * Define e valida os dados necessários
 * para um médico iniciar um atendimento.
 *
 * Utilizado pela rota:
 * PATCH /triagens/:id/iniciar-atendimento
 */
export class IniciarAtendimentoDto {

  /**
   * Identificador do médico que está
   * assumindo a triagem.
   *
   * Deve ser um ObjectId válido do MongoDB.
   */
  @IsNotEmpty()
  @IsMongoId()
  medico_id!: string;
}