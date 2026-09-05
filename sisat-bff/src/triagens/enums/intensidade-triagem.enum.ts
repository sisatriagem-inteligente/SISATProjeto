/**
 * Define os níveis de intensidade permitidos
 * durante o processo de triagem.
 *
 * Esses valores são utilizados para padronizar
 * os dados recebidos da MarIA e determinar
 * posteriormente a cor de classificação.
 */
export enum IntensidadeTriagem {
  /**
   * Sintomas classificados como leves.
   */
  LEVE = 'leve',

  /**
   * Sintomas classificados como moderados.
   */
  MODERADA = 'moderada',

  /**
   * Sintomas classificados como intensos.
   */
  INTENSA = 'intensa',
}