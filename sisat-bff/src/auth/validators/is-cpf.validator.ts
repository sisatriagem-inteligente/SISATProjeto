import { ValidateBy, ValidationOptions } from 'class-validator';

/** Verifica os dígitos de um CPF sem máscara; não consulta a Receita Federal. */
export function isValidCpf(value: unknown): boolean {
  if (typeof value !== 'string' || !/^\d{11}$/.test(value)) return false;
  if (/^(\d)\1{10}$/.test(value)) return false;

  for (let position = 9; position <= 10; position++) {
    const sum = Array.from(
      { length: position },
      (_, index) => Number(value[index]) * (position + 1 - index),
    ).reduce((total, part) => total + part, 0);
    const remainder = (sum * 10) % 11;
    const digit = remainder === 10 ? 0 : remainder;
    if (digit !== Number(value[position])) return false;
  }

  return true;
}

export function IsCpf(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return ValidateBy(
    {
      name: 'isCpf',
      validator: {
        validate: isValidCpf,
        defaultMessage: () => 'O CPF informado é inválido.',
      },
    },
    validationOptions,
  );
}
