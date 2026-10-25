import {
  ForbiddenException,
  UnauthorizedException,
  type ExecutionContext,
} from '@nestjs/common';
import { Types } from 'mongoose';

import { PacienteTriagemGuard } from './paciente-triagem.guard';

describe('PacienteTriagemGuard', () => {
  const verifyAsync = jest.fn();
  const guard = new PacienteTriagemGuard({ verifyAsync } as never);
  const pacienteId = new Types.ObjectId().toString();

  function contexto(authorization?: string) {
    const request = {
      headers: { authorization },
      pacienteId: undefined as string | undefined,
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as ExecutionContext;
    return { context, request };
  }

  beforeEach(() => jest.clearAllMocks());

  it('exige token Bearer', async () => {
    await expect(guard.canActivate(contexto().context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('recusa JWT inválido ou expirado', async () => {
    verifyAsync.mockRejectedValue(new Error('expired'));
    await expect(
      guard.canActivate(contexto('Bearer invalido').context),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('recusa token de médico', async () => {
    verifyAsync.mockResolvedValue({ sub: pacienteId, role: 'medico' });
    await expect(
      guard.canActivate(contexto('Bearer token').context),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('extrai o ID somente do JWT válido do paciente', async () => {
    verifyAsync.mockResolvedValue({ sub: pacienteId, role: 'paciente' });
    const { context, request } = contexto('Bearer token');

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.pacienteId).toBe(pacienteId);
  });
});
