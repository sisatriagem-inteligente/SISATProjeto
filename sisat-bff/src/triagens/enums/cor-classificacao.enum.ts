/**
 * Define as cores utilizadas para representar
 * a prioridade de uma triagem no SISAT.
 *
 * A classificação é definida a partir
 * da intensidade registrada na triagem.
 */
export enum CorClassificacao {
  /**
   * Prioridade associada à intensidade leve.
   */
  VERDE = 'verde',

  /**
   * Prioridade associada à intensidade moderada.
   */
  AMARELO = 'amarelo',

  /**
   * Prioridade associada à intensidade intensa.
   */
  VERMELHO = 'vermelho',
}