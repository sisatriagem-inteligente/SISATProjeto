import { Type } from 'class-transformer';

import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

/**
 * Define e valida as informações registradas
 * pelo médico durante o atendimento.
 *
 * Os campos são opcionais para permitir
 * atualizações parciais das informações médicas.
 *
 * Utilizado pela rota:
 * PATCH /triagens/:id/informacoes-medicas
 */

export class InformacoesMedicasDto {

  /** Altura do paciente em metros. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  altura?: number;

  /** Peso do paciente em quilogramas. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  peso?: number;

   /**
   * Temperatura corporal do paciente.
   *
   * Quando enviada, deve ser numérica
   * e não pode possuir valor negativo.
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  temperatura?: number;

   /**
   * Frequência cardíaca registrada
   * durante o atendimento.
   *
   * Quando enviada, deve ser numérica
   * e não negativa.
   */

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  frequencia_cardiaca?: number;

  /** Frequência respiratória em respirações por minuto. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  frequencia_respiratoria?: number;

   /**
   * Informações obtidas no exame físico
   * direcionado realizado pelo médico.
   */

  @IsOptional()
  @IsString()
  exame_fisico_direcionado?: string;

    /**
   * Observações adicionais registradas
   * pelo médico durante o atendimento.
   */

  @IsOptional()
  @IsString()
  observacoes?: string;
}
