import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/**
 * Controller principal criado na estrutura inicial
 * do projeto NestJS.
 *
 * Atualmente ele disponibiliza apenas uma rota
 * simples na raiz da aplicação.
 */

@Controller()
export class AppController {
   /**
   * Injeta o AppService utilizado
   * pela rota principal.
   */
  constructor(private readonly appService: AppService) {}

    /**
   * Retorna uma mensagem simples
   * quando a raiz da API é acessada.
   *
   * Rota:
   * GET /
   */

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
