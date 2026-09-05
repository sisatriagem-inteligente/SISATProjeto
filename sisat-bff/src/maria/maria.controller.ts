import { Body, Controller, Post } from '@nestjs/common';

import { EnviarMensagemDto } from './dto/enviar-mensagem.dto';
import { MariaService } from './maria.service';

/**
 * Disponibiliza ao frontend a comunicação com a MarIA.
 */
@Controller('maria')
export class MariaController {
  constructor(private readonly mariaService: MariaService) {}

  /**
   * Envia uma mensagem e aguarda a resposta da MarIA.
   *
   * Rota: POST /maria/mensagem
   */
  @Post('mensagem')
  enviarMensagem(@Body() enviarMensagemDto: EnviarMensagemDto) {
    return this.mariaService.enviarMensagem(enviarMensagemDto);
  }
}
