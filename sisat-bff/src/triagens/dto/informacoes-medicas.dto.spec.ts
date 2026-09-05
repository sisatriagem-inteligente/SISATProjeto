import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { InformacoesMedicasDto } from './informacoes-medicas.dto';

describe('InformacoesMedicasDto', () => {
  it('aceita os campos usados pelo formulário médico', async () => {
    const dto = plainToInstance(InformacoesMedicasDto, {
      altura: 1.75,
      peso: 70,
      temperatura: 36.5,
      frequencia_cardiaca: 80,
      frequencia_respiratoria: 18,
      exame_fisico_direcionado: 'Sem alterações.',
      observacoes: 'Paciente estável.',
    });

    const erros = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(erros).toHaveLength(0);
  });

  it('não aceita o campo removido de pressão arterial', async () => {
    const dto = plainToInstance(InformacoesMedicasDto, {
      pressao_arterial: '120/80',
    });

    const erros = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(erros).toHaveLength(1);
    expect(erros[0].property).toBe('pressao_arterial');
  });
});
