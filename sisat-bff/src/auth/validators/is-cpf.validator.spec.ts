import { validate } from 'class-validator';
import { CadastroDto } from '../dto/cadastro.dto';
import { isValidCpf } from './is-cpf.validator';

describe('isValidCpf', () => {
  it('aceita CPFs com os dois dígitos verificadores corretos', () => {
    expect(isValidCpf('52998224725')).toBe(true);
    expect(isValidCpf('11144477735')).toBe(true);
  });

  it.each([
    '52998224724',
    '52998224715',
    '11111111111',
    '00000000000',
    '1234567890',
    '529.982.247-25',
    '',
    52998224725,
  ])('rejeita CPF inválido: %s', (cpf) => {
    expect(isValidCpf(cpf)).toBe(false);
  });

  it('rejeita CPF inválido no DTO de cadastro', async () => {
    const cadastro = Object.assign(new CadastroDto(), {
      cpf: '52998224724',
      email: 'teste@example.com',
      password: 'senha-segura',
    });
    const errors = await validate(cadastro);
    expect(
      errors.find((error) => error.property === 'cpf')?.constraints,
    ).toHaveProperty('isCpf');
  });
});
