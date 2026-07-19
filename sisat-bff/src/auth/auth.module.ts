// Decorator utilizado para declarar um módulo do NestJS.
import { Module } from '@nestjs/common';

// Permite registrar schemas e models do Mongoose.
import { MongooseModule } from '@nestjs/mongoose';

// Módulo responsável pela geração e validação de JWT.
import { JwtModule } from '@nestjs/jwt';

// Service que contém as regras de autenticação.
import { AuthService } from './auth.service';

// Controller que disponibiliza as rotas de autenticação.
import { AuthController } from './auth.controller';

// Model e schema da coleção "pacientes".
import {
  Patient,
  PatientSchema,
} from './schemas/patient.schema';

// Model e schema da coleção "medicos".
import {
  Doctor,
  DoctorSchema,
} from './schemas/doctor.schema';

/*
 * Declara o módulo responsável pela autenticação.
 */
@Module({
  /*
   * imports contém outros módulos necessários
   * para o funcionamento deste módulo.
   */
  imports: [
    /*
     * Registra os models do Mongoose.
     *
     * Depois desse registro, eles podem ser injetados
     * no AuthService usando @InjectModel().
     */
    MongooseModule.forFeature([
      {
        /*
         * Registra o model Patient usando o PatientSchema.
         *
         * Esse model se comunica com a coleção "pacientes".
         */
        name: Patient.name,
        schema: PatientSchema,
      },
      {
        /*
         * Registra o model Doctor usando o DoctorSchema.
         *
         * Esse model se comunica com a coleção "medicos".
         */
        name: Doctor.name,
        schema: DoctorSchema,
      },
    ]),

    /*
     * Configura o módulo responsável pelos tokens JWT.
     */
    JwtModule.register({
      /*
       * Torna o JwtModule disponível globalmente
       * dentro da aplicação.
       */
      global: true,

      /*
       * Segredo utilizado para assinar e verificar os tokens.
       *
       * Para desenvolvimento local funciona assim, mas
       * futuramente deve ser movido para uma variável de
       * ambiente no arquivo .env.
       */
      secret: 'SEGREDO_SUPER_SEGURO_DO_SISAT_2026',

      /*
       * Define que cada token será válido por um dia.
       */
      signOptions: {
        expiresIn: '1d',
      },
    }),
  ],

  /*
   * Services e outros provedores disponíveis no módulo.
   */
  providers: [AuthService],

  /*
   * Controllers que disponibilizam rotas HTTP.
   */
  controllers: [AuthController],

  /*
   * Permite que outros módulos utilizem o AuthService.
   *
   * Isso poderá ser útil futuramente caso outro módulo
   * precise de alguma funcionalidade de autenticação.
   */
  exports: [AuthService],
})
export class AuthModule {}