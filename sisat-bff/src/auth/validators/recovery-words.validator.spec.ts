import { validate } from 'class-validator';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth.service';
import { CadastroDto } from '../dto/cadastro.dto';
import { ValidateRecoveryAnswerDto } from '../dto/validate-recovery-answer.dto';
import {
  normalizeRecoveryAnswer,
  recoveryWordsAreStrong,
} from './recovery-words.validator';

const words = ['girassol', 'montanha', 'caderno'];

describe('palavras de recuperação', () => {
  it('exige três palavras diferentes e rejeita repetições', () => {
    expect(recoveryWordsAreStrong(words)).toBe(true);
    expect(recoveryWordsAreStrong(['girassol', 'GIRASSOL', 'caderno'])).toBe(
      false,
    );
  });

  it('aceita respostas com espaços e ignora diferenças de acento e maiúsculas', async () => {
    const dto = Object.assign(new ValidateRecoveryAnswerDto(), {
      cpf: '52998224725',
      answer: 'Carrinho Azul',
    });
    expect(await validate(dto)).toHaveLength(0);
    expect(normalizeRecoveryAnswer('  PRAIA   do FÓRTE  ')).toBe(
      'praia do forte',
    );
  });

  it('permite cadastrar sem respostas para concluí-las na segunda tela', async () => {
    const dto = Object.assign(new CadastroDto(), {
      cpf: '52998224725',
      email: 'teste@example.com',
      password: 'Laranjas dançam sob a lua de inverno!',
    });
    expect(await validate(dto)).toHaveLength(0);
  });

  it('rejeita palavra curta no DTO', async () => {
    const dto = Object.assign(new ValidateRecoveryAnswerDto(), {
      cpf: '52998224725',
      answer: 'sol',
    });
    const errors = await validate(dto);
    expect(
      errors.find((error) => error.property === 'answer'),
    ).toBeDefined();
  });

  it('salva somente hashes das três palavras no cadastro', async () => {
    const create = jest.fn((data: Record<string, string>) =>
      Promise.resolve({ _id: 'patient-id', ...data }),
    );
    const model = {
      findOne: jest.fn(() => ({ exec: () => Promise.resolve(null) })),
      create,
    };
    const service = new AuthService(model as never, {} as never, {} as never);
    await service.register({
      cpf: '52998224725',
      email: 'teste@example.com',
      password: 'Laranjas dançam sob a lua de inverno!',
      recoveryWord1: words[0],
      recoveryWord2: words[1],
      recoveryWord3: words[2],
    });

    const saved = create.mock.calls[0][0];
    expect(saved).not.toHaveProperty('recoveryWord1');
    expect(await bcrypt.compare(words[0], saved.recoveryWord1Hash)).toBe(true);
    expect(await bcrypt.compare(words[1], saved.recoveryWord2Hash)).toBe(true);
    expect(await bcrypt.compare(words[2], saved.recoveryWord3Hash)).toBe(true);
  });

});
