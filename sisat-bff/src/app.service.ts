import { Injectable } from '@nestjs/common';

/**
 * Service principal criado na estrutura inicial
 * da aplicação NestJS.
 *
 * Atualmente possui apenas um método simples
 * utilizado pela rota raiz da API.
 */

@Injectable()
export class AppService {

   /**
   * Retorna uma mensagem utilizada
   * para confirmar que a aplicação está funcionando.
   */
  getHello(): string {
    return 'Hello World!';
  }
}
