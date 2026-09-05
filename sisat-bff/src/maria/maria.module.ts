import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { TriagensModule } from '../triagens/triagem.module';
import { Triagem, TriagemSchema } from '../triagens/schemas/triagem.schema';
import { MariaController } from './maria.controller';
import { MariaService } from './maria.service';

/**
 * Organiza a comunicação do BFF com a API da MarIA.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Triagem.name,
        schema: TriagemSchema,
      },
    ]),
    TriagensModule,
  ],
  controllers: [MariaController],
  providers: [MariaService],
})
export class MariaModule {}
