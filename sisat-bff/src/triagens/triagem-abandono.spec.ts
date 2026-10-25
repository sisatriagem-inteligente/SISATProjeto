import { ConflictException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

import { TriagensService } from './triagem.service';

describe('TriagensService.abandonarTriagem', () => {
  const pacienteId = new Types.ObjectId().toString();
  const triagemId = new Types.ObjectId().toString();
  const findOneAndDelete = jest.fn();
  const findById = jest.fn();
  const service = new TriagensService(
    { findOneAndDelete, findById } as never,
    {} as never,
    {} as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('exclui atomicamente somente a triagem própria ainda em coleta', async () => {
    findOneAndDelete.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ _id: triagemId }),
    });

    await expect(
      service.abandonarTriagem(triagemId, pacienteId),
    ).resolves.toEqual({
      message: 'Triagem abandonada e excluída com sucesso.',
    });
    expect(findOneAndDelete).toHaveBeenCalledWith(
      expect.objectContaining({
        paciente_id: new Types.ObjectId(pacienteId),
        status: 'Aguardando',
        medico_id: null,
        chat_finalizado: { $ne: true },
        cor_classificacao: null,
      }),
    );
    expect(findById).not.toHaveBeenCalled();
  });

  it('não revela nem exclui triagem de outro paciente', async () => {
    findOneAndDelete.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });
    findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        paciente_id: new Types.ObjectId(),
      }),
    });

    await expect(
      service.abandonarTriagem(triagemId, pacienteId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('recusa triagem própria que já não está em coleta', async () => {
    findOneAndDelete.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });
    findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue({
        paciente_id: new Types.ObjectId(pacienteId),
      }),
    });

    await expect(
      service.abandonarTriagem(triagemId, pacienteId),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
