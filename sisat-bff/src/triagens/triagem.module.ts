import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  Triagem,
  TriagemSchema,
} from './schemas/triagem.schema';

import {
  Doctor,
  DoctorSchema,
} from '../auth/schemas/doctor.schema';

import {
  Patient,
  PatientSchema,
} from '../auth/schemas/patient.schema';

import { TriagensController } from './triagem.controller';
import { TriagensService } from './triagem.service';

/**
 * Módulo responsável pelas funcionalidades
 * relacionadas às triagens do SISAT.
 *
 * Ele reúne o controller, o service
 * e os models necessários para executar
 * as regras de negócio das triagens.
 */

@Module({
  imports: [

     /**
     * Registra os models utilizados
     * pelo TriagensService.
     *
     * Triagem:
     * permite consultar e modificar
     * a coleção "triagens".
     *
     * Doctor:
     * permite verificar os médicos
     * que assumem os atendimentos.
     */
    MongooseModule.forFeature([
      {
        name: Triagem.name,
        schema: TriagemSchema,
      },
      {
        name: Doctor.name,
        schema: DoctorSchema,
      },
      {
        name: Patient.name,
        schema: PatientSchema,
      },
    ]),
  ],

   /**
   * Controller responsável pelas rotas
   * iniciadas por /triagens.
   */
  controllers: [TriagensController],

   /**
   * Service que contém as regras
   * de negócio das triagens.
   */
  providers: [TriagensService],

  /**
   * Permite que o módulo da MarIA reutilize a regra
   * que salva o resultado final da triagem.
   */
  exports: [TriagensService],
})
export class TriagensModule {}
