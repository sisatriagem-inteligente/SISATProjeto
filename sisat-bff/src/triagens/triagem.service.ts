import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { CriarTriagemDto } from './dto/criar-triagem.dto';
import {
  Triagem,
  TriagemDocument,
} from './schemas/triagem.schema';

@Injectable()
export class TriagensService {
  constructor(
    @InjectModel(Triagem.name)
    private readonly triagemModel: Model<TriagemDocument>,
  ) {}

  async criarTriagem(
    criarTriagemDto: CriarTriagemDto,
  ): Promise<TriagemDocument> {
    const { paciente_id } = criarTriagemDto;

    const triagem = await this.triagemModel.create({
      paciente_id: new Types.ObjectId(paciente_id),
    });

    return triagem;
  }
}
