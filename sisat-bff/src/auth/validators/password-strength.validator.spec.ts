import { validate } from 'class-validator';
import { CadastroDto } from '../dto/cadastro.dto';
import { classifyPassword } from './password-strength.validator';

async function passwordErrors(password: string) {
  const cadastro = Object.assign(new CadastroDto(), {
    cpf: '52998224725',
    email: 'teste@example.com',
    password,
  });
  const errors = await validate(cadastro);
  return errors.find((error) => error.property === 'password')?.constraints;
}

describe('validação de senha no cadastro', () => {
  it('classifica uma senha previsível como fraca', () => {
    expect(classifyPassword('123456789012345')).toBe('fraca');
  });

  it('recusa senha com menos de 15 caracteres', async () => {
    expect(await passwordErrors('senha-segura')).toHaveProperty('minLength');
  });

  it('recusa senha longa, mas previsível', async () => {
    expect(await passwordErrors('123456789012345')).toHaveProperty(
      'isStrongPassword',
    );
  });

  it('recusa senha com mais de 72 bytes em UTF-8', async () => {
    expect(await passwordErrors('á'.repeat(37))).toHaveProperty(
      'maxPasswordBytes',
    );
  });

  it('aceita frase-senha longa e pouco previsível', async () => {
    expect(
      await passwordErrors('Laranjas dançam sob a lua de inverno!'),
    ).toBeUndefined();
  });
});
