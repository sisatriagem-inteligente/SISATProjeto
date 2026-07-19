/*
 * Module é o decorator usado para declarar um módulo NestJS.
 */
import { Module } from '@nestjs/common';

/*
 * MongooseModule permite conectar o NestJS ao MongoDB.
 */
import { MongooseModule } from '@nestjs/mongoose';

/*
 * Controller principal criado inicialmente pelo NestJS.
 *
 * Ele normalmente contém uma rota de teste, como:
 *
 * GET /
 */
import { AppController } from './app.controller';

/*
 * Service principal criado inicialmente pelo NestJS.
 *
 * Ele costuma ser utilizado pelo AppController.
 */
import { AppService } from './app.service';

/*
 * Módulo responsável pelas funcionalidades de autenticação:
 *
 * - cadastro do paciente;
 * - login do paciente;
 * - login do médico;
 * - bcrypt;
 * - JWT.
 */
import { AuthModule } from './auth/auth.module';

import { TriagensModule } from './triagens/triagem.module';

/*
 * Declara o módulo principal da aplicação.
 */
@Module({
  /*
   * Módulos importados e disponibilizados para a aplicação.
   */
  imports: [
    /*
     * Cria a conexão principal com o MongoDB.
     *
     * mongodb://localhost:27017
     * indica que o MongoDB está rodando localmente.
     *
     * BD_SISAT
     * é o nome do banco utilizado pelo projeto.
     */
    MongooseModule.forRoot(
      'mongodb://localhost:27017/BD_SISAT',
    ),

    /*
     * Importa o módulo de autenticação.
     *
     * Ao importar o AuthModule, a aplicação passa
     * a conhecer:
     *
     * AuthController
     * AuthService
     * PatientSchema
     * DoctorSchema
     * JwtModule
     */
    AuthModule,
    TriagensModule,
  ],

  /*
   * Controllers pertencentes diretamente ao AppModule.
   */
  controllers: [AppController],

  /*
   * Services pertencentes diretamente ao AppModule.
   */
  providers: [AppService],
})
export class AppModule {}


/*O AuthModule contém:

MongooseModule.forFeature([
  PatientSchema,
  DoctorSchema,
]);

O forRoot() cria a conexão geral, enquanto o forFeature() registra quais schemas aquele módulo utilizará.

Diferença entre forRoot e forFeature
MongooseModule.forRoot()

Cria a conexão com o banco:

MongooseModule.forRoot(
  'mongodb://localhost:27017/BD_SISAT',
);

Deve aparecer normalmente apenas uma vez na aplicação.

MongooseModule.forFeature()

Registra os schemas de um módulo específico:

MongooseModule.forFeature([
  {
    name: Patient.name,
    schema: PatientSchema,
  },
  {
    name: Doctor.name,
    schema: DoctorSchema,
  },
]);

Pode aparecer em diferentes módulos, dependendo das coleções usadas.

O fluxo é:* */