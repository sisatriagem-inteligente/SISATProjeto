import { ValidateBy } from 'class-validator';
import { classifyPassword } from './password-strength.validator';
//verifica cada resposta individualmente — de 4 a 80 caracteres após remover espaços das extremidades e, no máximo, 72 bytes em UTF-8.
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
//padroniza a resposta removendo espaços extras e diferenças de acentuação e maiúsculas/minúsculas. Essa mesma normalização é usada antes de gerar o hash e ao conferir uma resposta.
export function normalizeRecoveryAnswer(answer: string): string {
  return answer
    .trim()
    .replace(/\s+/gu, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/gu, '')
    .toLocaleLowerCase('pt-BR');
}
//exige três respostas diferentes após a normalização e avalia a força das três em conjunto usando zxcvbn-ts.
export function recoveryWordsAreStrong(words: string[]): boolean {
  if (
    new Set(words.map(normalizeRecoveryAnswer)).size !== 3
  ) {
    return false;
  }
  return classifyPassword(words.join(' ')) === 'forte';
}
