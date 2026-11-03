import { describe, expect, it } from 'vitest';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SaveMedicalRecordDto } from '../../apps/api-gateway/src/medical-records/dto/save-medical-record.dto';

describe('Validacion de datos clinicos', () => {
  it('rechaza peso fuera de rango', async () => {
    const errors = await validate(plainToInstance(SaveMedicalRecordDto, {
      weight_kg: 900,
    }));
    expect(errors.some(e => e.property === 'weight_kg')).toBe(true);
  });

  it('convierte peso y altura numericos enviados como texto', async () => {
    const dto = plainToInstance(SaveMedicalRecordDto, {
      weight_kg: '70', height_cm: '170',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.weight_kg).toBe(70);
    expect(dto.height_cm).toBe(170);
  });
});
