import { ValidateBy, type ValidationArguments } from 'class-validator';
import { zxcvbn, zxcvbnOptions } from '@zxcvbn-ts/core';
import * as commonLanguage from '@zxcvbn-ts/language-common';
import * as portugueseLanguage from '@zxcvbn-ts/language-pt-br';


//configura os dicionários e as mensagens em português usados na avaliação da senha.
zxcvbnOptions.setOptions({
  translations: portugueseLanguage.translations,
  graphs: commonLanguage.adjacencyGraphs,
  dictionary: {
    ...commonLanguage.dictionary,
    ...portugueseLanguage.dictionary,
  },
});

export type PasswordStrength = 'fraca' | 'moderada' | 'forte';


//transforma a pontuação do zxcvbn-ts em três categorias: fraca, moderada e forte.
export function classifyPassword(password: string): PasswordStrength {
  const score = zxcvbn(password).score;

  if (score <= 1) return 'fraca';
  if (score === 2) return 'moderada';
  return 'forte';
}

//verificação senha forte
export function IsStrongPassword(): PropertyDecorator {
  return ValidateBy({
    name: 'isStrongPassword',
    validator: {
      validate(value: unknown): boolean {
        if (typeof value !== 'string') return false;
        //o return true não aceita sozinho uma senha curta ou acima de 72 bytes. Ele apenas deixa essas falhas para os validadores específicos (@MinLength e @MaxPasswordBytes), evitando uma mensagem de força adicional para o mesmo problema.
        if (value.length < 15 || Buffer.byteLength(value, 'utf8') > 72) {
          return true;
        }
        return classifyPassword(value) === 'forte';
      },
      defaultMessage(args: ValidationArguments): string {
        if (typeof args.value !== 'string') {
          return 'A senha deve ser um texto.';
        }
        const strength = classifyPassword(args.value);
        return `A senha foi classificada como ${strength}. Escolha uma senha mais forte.`;
      },
    },
  });
}
//verificação caracteres
export function HasRequiredPasswordCharacters(): PropertyDecorator {
  return ValidateBy({
    name: 'hasRequiredPasswordCharacters',
    validator: {
      validate(value: unknown): boolean {
        if (typeof value !== 'string') return false;
        return (
          /[A-Z]/.test(value) &&
          /[a-z]/.test(value) &&
          /[0-9]/.test(value) &&
          /[!-/:-@[-`{-~]/.test(value)
        );
      },
      defaultMessage(): string {
        return 'A senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um símbolo.';
      },
    },
  });
}

//mede o tamanho em bytes UTF-8, não em quantidade de caracteres, para respeitar o limite de 72 bytes do bcrypt.
export function MaxPasswordBytes(): PropertyDecorator {
  return ValidateBy({
    name: 'maxPasswordBytes',
    validator: {
      validate(value: unknown): boolean {
        return (
          typeof value === 'string' && Buffer.byteLength(value, 'utf8') <= 72
        );
      },
      defaultMessage(): string {
        return 'A senha ficou longa demais. Tente encurtá-la';
      },
    },
  });
}
