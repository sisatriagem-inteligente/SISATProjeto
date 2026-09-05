import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthModule } from './auth/auth.module';
import { TriagensModule } from './triagens/triagem.module';
import { MariaModule } from './maria/maria.module';

/**
 * Módulo principal da aplicação.
 *
 * O AppModule funciona como ponto central do backend,
 * reunindo a conexão com o banco de dados e os módulos
 * responsáveis pelas funcionalidades do SISAT.
 */
@Module({
  imports: [
    /**
     * Cria a conexão principal da aplicação
     * com o banco MongoDB.
     *
     * Neste projeto, o MongoDB está sendo executado
     * localmente e utiliza o banco BD_SISAT.
     */
    MongooseModule.forRoot(
      'mongodb://localhost:27017/BD_SISAT',
    ),

    /**
     * Módulo responsável pelo cadastro
     * e autenticação de pacientes e médicos.
     */
    AuthModule,

    /**
     * Módulo responsável pelo fluxo
     * de triagens e atendimentos.
     */
    TriagensModule,

    /**
     * Módulo responsável pela comunicação entre
     * o frontend, o BFF e a API da MarIA.
     */
    MariaModule,
  ],

  /**
   * Controller principal criado na estrutura
   * inicial da aplicação NestJS.
   */
  controllers: [AppController],

  /**
   * Service principal utilizado
   * pelo AppController.
   */
  providers: [AppService],
})
export class AppModule {}
