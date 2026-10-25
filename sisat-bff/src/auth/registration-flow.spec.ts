import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

const answers = ['Carrinho Azul', 'Parque das Flores', 'Veterinária'];

describe('cadastro em duas etapas', () => {
  it('cria a conta sem respostas e entrega apenas um token temporário de configuração', async () => {
    const create = jest.fn((data: Record<string, string>) =>
      Promise.resolve({ _id: 'patient-id', ...data }),
    );
    const model = {
      findOne: jest.fn(() => ({ exec: () => Promise.resolve(null) })),
      create,
    };
    const jwt = { signAsync: jest.fn().mockResolvedValue('setup-token') };
    const service = new AuthService(model as never, {} as never, jwt as never);

    const result = await service.register({
      cpf: '52998224725',
      email: 'teste@example.com',
      password: 'Laranjas dançam sob a lua de inverno!',
    });

    expect(result).toHaveProperty('setup_token', 'setup-token');
    expect(result).not.toHaveProperty('access_token');
    expect(create.mock.calls[0][0]).not.toHaveProperty('recoveryWord1Hash');
    expect(jwt.signAsync).toHaveBeenCalledWith(
      { sub: 'patient-id', purpose: 'setup_recovery' },
      { expiresIn: '10m' },
    );
  });

  it('configura respostas uma vez; rejeita reutilização e tokens de outra finalidade', async () => {
    let alreadyConfigured = false;
    const updateOne = jest.fn((_filter: unknown, update: { $set: Record<string, string> }) => ({
      exec: async () => {
        if (alreadyConfigured) return { matchedCount: 0 };
        alreadyConfigured = true;
        expect(update.$set).toHaveProperty('recoveryWord1Hash');
        expect(
          await bcrypt.compare('carrinho azul', update.$set.recoveryWord1Hash),
        ).toBe(true);
        return { matchedCount: 1 };
      },
    }));
    const jwt = {
      verifyAsync: jest.fn().mockResolvedValue({
        sub: 'patient-id',
        purpose: 'setup_recovery',
      }),
    };
    const service = new AuthService(
      { updateOne } as never,
      {} as never,
      jwt as never,
    );
    const request = {
      setupToken: 'setup-token',
      recoveryWord1: answers[0],
      recoveryWord2: answers[1],
      recoveryWord3: answers[2],
    };

    await expect(service.completeRecoverySetup(request)).resolves.toHaveProperty('message');
    expect(updateOne.mock.calls[0][0]).toEqual({
      _id: 'patient-id',
      recoveryWord1Hash: { $exists: false },
      recoveryWord2Hash: { $exists: false },
      recoveryWord3Hash: { $exists: false },
    });
    await expect(service.completeRecoverySetup(request)).rejects.toThrow();
    jwt.verifyAsync.mockResolvedValueOnce({ sub: 'patient-id', purpose: 'login' });
    await expect(service.completeRecoverySetup(request)).rejects.toThrow();
    jwt.verifyAsync.mockRejectedValueOnce(new Error('expired'));
    await expect(service.completeRecoverySetup(request)).rejects.toThrow();
  });
});
