import { ValidateBy } from 'class-validator';
import { classifyPassword } from './password-strength.validator';

export function IsRecoveryWord(): PropertyDecorator {
  return ValidateBy({
    name: 'isRecoveryWord',
    validator: {
      validate(value: unknown): boolean {
        return (
          typeof value === 'string' &&
          value.trim().length >= 4 &&
          value.trim().length <= 80 &&
          Buffer.byteLength(value, 'utf8') <= 72
        );
      },
      defaultMessage(): string {
        return 'Cada resposta de recuperação deve ter de 4 a 80 caracteres e no máximo 72 bytes em UTF-8.';
      },
    },
  });
}

export function normalizeRecoveryAnswer(answer: string): string {
  return answer
    .trim()
    .replace(/\s+/gu, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/gu, '')
    .toLocaleLowerCase('pt-BR');
}

export function recoveryWordsAreStrong(words: string[]): boolean {
  if (
    new Set(words.map(normalizeRecoveryAnswer)).size !== 3
  ) {
    return false;
  }
  return classifyPassword(words.join(' ')) === 'forte';
}
