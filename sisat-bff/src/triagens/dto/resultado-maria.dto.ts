import { Type } from 'class-transformer'; //@Type() informa qual classe representa aquele objeto:

import {
  IsArray,
  IsEnum,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested, //@ValidateNested() manda o NestJS validar o conteúdo interno.
} from 'class-validator';

import { IntensidadeTriagem } from '../enums/intensidade-triagem.enum';

/**
 * Define e valida os dados básicos do paciente
 * recebidos no resultado produzido pela MarIA.
 */
export class DadosPacienteMariaDto {
  @IsString()
  @IsNotEmpty()
  nome!: string;

   /**
   * Idade do paciente.
   *
   * Deve ser um número inteiro entre
   * 0 e 130 anos.
   */

  @IsInt()
  @Min(0)
  @Max(130)
  idade!: number;

  @IsString()
  @IsNotEmpty()
  sexo!: string;
}

/**
 * Define e valida os dados relacionados
 * à triagem coletados pela MarIA.
 */

export class DadosTriagemMariaDto {
  @IsString()
  @IsNotEmpty()
  queixa_principal!: string;

   /**
   * Lista de sintomas informados pelo paciente.
   *
   * Cada elemento do array deve ser uma string.
   */

  @IsArray()
  @IsString({ each: true })
  sintomas!: string[];

  @IsString()
  @IsNotEmpty()
  tempo_sintomas!: string;
/**
   * Intensidade dos sintomas.
   *
   * O valor deve corresponder a uma das opções
   * definidas no enum IntensidadeTriagem.
   */
  @IsEnum(IntensidadeTriagem)
  intensidade!: IntensidadeTriagem;

    /**
   * Lista de informações adicionais
   * coletadas durante a triagem.
   */

  @IsArray()
  @IsString({ each: true })
  informacoes_complementares!: string[];
}

/**
 * Representa o resumo produzido pela MarIA
 * a partir das informações coletadas.
 */
export class ResumoTriagemMariaDto {
  @IsString()
  @IsNotEmpty()
  resumo!: string;
}

/**
 * Representa uma hipótese clínica inicial
 * produzida a partir dos dados da triagem.
 *
 * Cada hipótese possui uma descrição
 * e uma justificativa.
 */
export class HipoteseClinicaInicialMariaDto {
  @IsString()
  @IsNotEmpty()
  hipotese!: string;

  @IsString()
  @IsNotEmpty()
  justificativa!: string;
}

/**
 * Define e valida o corpo completo recebido
 * com o resultado da MarIA.
 *
 * O DTO reúne os dados do paciente,
 * informações da triagem, resumo e
 * hipóteses clínicas iniciais.
 *
 * Utilizado pela rota:
 * PATCH /triagens/:id/resultado-maria
 */

export class ResultadoMariaDto {
   /**
   * Identificador opcional do histórico
   * da conversa realizada com a MarIA.
   */
  @IsOptional()
  @IsMongoId()
  historico_chat_id?: string | null;

   /**
   * Dados básicos do paciente.
   *
   * @ValidateNested permite validar os campos
   * internos utilizando DadosPacienteMariaDto.
   *
   * @Type informa ao class-transformer qual classe
   * deve representar o objeto recebido.
   */

  @IsObject()
  @ValidateNested()
  @Type(() => DadosPacienteMariaDto)
  dados_paciente!: DadosPacienteMariaDto;
   /**
   * Informações coletadas durante a triagem.
   */
  @IsObject()
  @ValidateNested()
  @Type(() => DadosTriagemMariaDto)
  dados_triagem!: DadosTriagemMariaDto;

   /**
   * Resumo produzido a partir da conversa.
   */

  @IsObject()
  @ValidateNested()
  @Type(() => ResumoTriagemMariaDto)
  resumo_triagem!: ResumoTriagemMariaDto;
/**
   * Lista de hipóteses clínicas iniciais.
   *
   * Cada elemento do array é validado utilizando
   * HipoteseClinicaInicialMariaDto.
   */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HipoteseClinicaInicialMariaDto)
  hipoteses_clinicas_iniciais!:
    HipoteseClinicaInicialMariaDto[];
}