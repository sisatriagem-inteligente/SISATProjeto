/**
 * Define os tipos de usuário que podem
 * ser autenticados no SISAT.
 *
 * O uso de enum mantém os valores padronizados
 * em toda a aplicação.
 */
export enum UserRole {
  /**
   * Representa um usuário do tipo paciente.
   */
  PACIENTE = 'paciente',

  /**
   * Representa um usuário do tipo médico.
   */
  MEDICO = 'medico',
}