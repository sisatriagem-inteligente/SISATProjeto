import { ValidateBy, type ValidationArguments } from 'class-validator';
import { zxcvbn, zxcvbnOptions } from '@zxcvbn-ts/core';
import * as commonLanguage from '@zxcvbn-ts/language-common';
import * as portugueseLanguage from '@zxcvbn-ts/language-pt-br';

zxcvbnOptions.setOptions({
  translations: portugueseLanguage.translations,
  graphs: commonLanguage.adjacencyGraphs,
  dictionary: {
    ...commonLanguage.dictionary,
    ...portugueseLanguage.dictionary,
  },
});

export type PasswordStrength = 'fraca' | 'moderada' | 'forte';

export function classifyPassword(password: string): PasswordStrength {
  const score = zxcvbn(password).score;

  if (score <= 1) return 'fraca';
  if (score === 2) return 'moderada';
  return 'forte';
}

export function IsStrongPassword(): PropertyDecorator {
  return ValidateBy({
    name: 'isStrongPassword',
    validator: {
      validate(value: unknown): boolean {
        if (typeof value !== 'string') return false;
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
        return 'A senha deve ter no máximo 72 bytes em UTF-8.';
      },
    },
  });
}
