import { createHash } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { validate } from 'class-validator';
import { AuthService } from './auth.service';
import { ResetPasswordDto } from './dto/reset-password.dto';

type TestPatient = {
  _id: string;
  cpf: string;
  senha: string;
  recoveryWord1Hash?: string;
  recoveryWord2Hash?: string;
  recoveryWord3Hash?: string;
  recoveryFailedAttempts: number;
  recoveryBlockedUntil?: Date;
  recoveryResetTokenHash?: string;
  recoveryResetExpiresAt?: Date;
};

async function createFixture() {
  const patient: TestPatient = {
    _id: 'patient-id',
    cpf: '52998224725',
    senha: await bcrypt.hash('senha anterior', 10),
    recoveryWord1Hash: await bcrypt.hash('carrinho azul', 10),
    recoveryWord2Hash: await bcrypt.hash('parque das flores', 10),
    recoveryWord3Hash: await bcrypt.hash('veterinaria', 10),
    recoveryFailedAttempts: 0,
  };
  const updateOne = jest.fn(
    (
      filter: Record<string, unknown>,
      update: { $set: Record<string, unknown>; $unset?: Record<string, unknown> },
    ) => ({
      exec: async () => {
        if (filter.recoveryResetTokenHash) {
          const expiryFilter = filter.recoveryResetExpiresAt as { $gt: Date };
          if (
            patient.recoveryResetTokenHash !== filter.recoveryResetTokenHash ||
            !patient.recoveryResetExpiresAt ||
            patient.recoveryResetExpiresAt <= expiryFilter.$gt ||
            (patient.recoveryBlockedUntil && patient.recoveryBlockedUntil > new Date())
          ) {
            return { matchedCount: 0 };
          }
        }
        Object.assign(patient, update.$set);
        for (const key of Object.keys(update.$unset ?? {})) {
          delete (patient as unknown as Record<string, unknown>)[key];
        }
        return { matchedCount: 1 };
      },
    }),
  );
  const model = {
    findOne: jest.fn(() => ({ exec: () => Promise.resolve(patient) })),
    updateOne,
  };
  return {
    patient,
    updateOne,
    service: new AuthService(model as never, {} as never, {} as never),
  };
}

describe('recuperação em duas chamadas', () => {
  it('confere uma resposta, armazena só o hash do token e consome-o uma vez', async () => {
    const { patient, service } = await createFixture();
    await expect(
      service.validateRecoveryAnswer({ cpf: patient.cpf, answer: 'errada' }),
    ).rejects.toThrow();
    expect(patient.recoveryFailedAttempts).toBe(1);

    const validation = await service.validateRecoveryAnswer({
      cpf: patient.cpf,
      answer: '  PARQUE DAS FLÔRES  ',
    });
    expect(validation.reset_token).toBeTruthy();
    expect(validation.expires_in_seconds).toBe(600);
    expect(patient.recoveryResetTokenHash).toBe(
      createHash('sha256').update(validation.reset_token).digest('hex'),
    );
    expect(patient.recoveryResetTokenHash).not.toBe(validation.reset_token);

    const newPassword = 'Girassóis observam a chuva de outubro!';
    await expect(
      service.resetPassword({ resetToken: validation.reset_token, newPassword }),
    ).resolves.toHaveProperty('message');
    expect(await bcrypt.compare(newPassword, patient.senha)).toBe(true);
    expect(patient.recoveryResetTokenHash).toBeUndefined();
    await expect(
      service.resetPassword({ resetToken: validation.reset_token, newPassword }),
    ).rejects.toThrow();
  });

  it('rejeita token expirado e bloqueia após cinco respostas incorretas', async () => {
    const { patient, service } = await createFixture();
    const validation = await service.validateRecoveryAnswer({
      cpf: patient.cpf,
      answer: 'carrinho azul',
    });
    patient.recoveryResetExpiresAt = new Date(Date.now() - 1000);
    await expect(
      service.resetPassword({
        resetToken: validation.reset_token,
        newPassword: 'Girassóis observam a chuva de outubro!',
      }),
    ).rejects.toThrow();

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await expect(
        service.validateRecoveryAnswer({ cpf: patient.cpf, answer: 'errada' }),
      ).rejects.toThrow();
    }
    expect(patient.recoveryBlockedUntil).toBeInstanceOf(Date);
    await expect(
      service.validateRecoveryAnswer({ cpf: patient.cpf, answer: 'carrinho azul' }),
    ).rejects.toThrow();
  });

  it('valida a nova senha antes de permitir a redefinição', async () => {
    const dto = Object.assign(new ResetPasswordDto(), {
      resetToken: 'token',
      newPassword: '123456789012345',
    });
    const errors = await validate(dto);
    expect(errors.find((error) => error.property === 'newPassword')).toBeDefined();
  });
});
