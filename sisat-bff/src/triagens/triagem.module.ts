import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  Triagem,
  TriagemSchema,
} from './schemas/triagem.schema';

import { TriagensController } from './triagem.controller';
import { TriagensService } from './triagem.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Triagem.name,
        schema: TriagemSchema,
      },
    ]),
  ],
  controllers: [TriagensController],
  providers: [TriagensService],
})
export class TriagensModule {}
