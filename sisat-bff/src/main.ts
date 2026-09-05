import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

import { AppModule } from './app.module';

/**
 * Função responsável por inicializar
 * a aplicação NestJS.
 *
 * Aqui são configurados recursos globais,
 * como CORS, validação dos DTOs e a porta
 * utilizada pelo servidor.
 */
async function bootstrap() {
  /**
   * Cria a aplicação utilizando o AppModule
   * como módulo principal.
   */
  const app =
    await NestFactory.create(AppModule);

  /**
   * Habilita o CORS para permitir requisições
   * vindas de outras origens.
   *
   * Durante o desenvolvimento, o frontend
   * e o backend são executados em portas diferentes.
   */
  app.enableCors({
    origin: '*',
  });

  /**
   * Configura a validação global das requisições.
   *
   * Todos os DTOs utilizados pelos controllers
   * passam por este ValidationPipe antes que
   * a requisição chegue às regras de negócio.
   */
  app.useGlobalPipes(
    new ValidationPipe({
      /**
       * Considera apenas propriedades
       * declaradas nos DTOs.
       */
      whitelist: true,

      /**
       * Retorna erro quando a requisição
       * contém propriedades que não existem
       * no DTO esperado.
       */
      forbidNonWhitelisted: true,

      /**
       * Permite que os dados recebidos sejam
       * transformados em instâncias dos DTOs,
       * possibilitando também conversões definidas
       * pelo class-transformer.
       */
      transform: true,
    }),
  );

  /**
   * Inicia o servidor HTTP na porta 3000.
   */
  await app.listen(3000);
}

/**
 * Executa a função responsável
 * pela inicialização do backend.
 */
void bootstrap();