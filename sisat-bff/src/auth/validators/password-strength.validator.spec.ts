import { validate } from 'class-validator';
import { CadastroDto } from '../dto/cadastro.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
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
      await passwordErrors('Laranjas7 dançam sob a lua de inverno!'),
    ).toBeUndefined();
  });

  it.each([
    ['maiúscula', 'laranjas7 dançam sob a lua de inverno!'],
    ['minúscula', 'LARANJAS7 DANÇAM SOB A LUA DE INVERNO!'],
    ['número', 'Laranjas dançam sob a lua de inverno!'],
    ['símbolo', 'Laranjas7 dançam sob a lua de inverno'],
  ])('recusa senha sem %s', async (_tipo, password) => {
    expect(await passwordErrors(password)).toHaveProperty(
      'hasRequiredPasswordCharacters',
    );
  });

  it('aplica a mesma regra na redefinição de senha', async () => {
    const dto = Object.assign(new ResetPasswordDto(), {
      resetToken: 'token-de-teste',
      newPassword: 'senhacomquinze123',
    });
    const errors = await validate(dto);
    expect(
      errors.find((error) => error.property === 'newPassword')?.constraints,
    ).toHaveProperty('hasRequiredPasswordCharacters');
  });
});
