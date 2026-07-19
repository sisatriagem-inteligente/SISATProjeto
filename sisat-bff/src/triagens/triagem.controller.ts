import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';

import { CriarTriagemDto } from './dto/criar-triagem.dto';
import { TriagensService } from './triagem.service';

@Controller('triagens')
export class TriagensController {
  constructor(
    private readonly triagensService: TriagensService,
  ) {}

  @Post()
  async criarTriagem(
    @Body() criarTriagemDto: CriarTriagemDto,
  ) {
    const triagem =
      await this.triagensService.criarTriagem(
        criarTriagemDto,
      );

    return {
      message: 'Triagem criada com sucesso.',
      triagem: {
        id: triagem._id.toString(),
        paciente_id: triagem.paciente_id.toString(),
        status: triagem.status,
      },
    };
  }
}
