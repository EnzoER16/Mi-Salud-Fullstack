import { describe, expect, it } from 'vitest';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterDto } from '../../apps/api-gateway/src/auth/dto/register.dto';
import { UserRole } from '@app/contracts';

const validUser = {
  username: 'PacienteDemo',
  email: 'paciente.test@gmail.com',
  password: 'ClaveSegura123!',
  role: UserRole.PATIENT,
};

describe('Validacion real del DTO de registro', () => {
  it('acepta un paciente valido', async () => {
    const errors = await validate(plainToInstance(RegisterDto, validUser));
    expect(errors).toHaveLength(0);
  });

  it('rechaza un correo invalido', async () => {
    const errors = await validate(plainToInstance(RegisterDto, {
      ...validUser, email: 'no-es-email',
    }));
    expect(errors.some(e => e.property === 'email')).toBe(true);
  });

  it('rechaza un rol no permitido', async () => {
    const errors = await validate(plainToInstance(RegisterDto, {
      ...validUser, role: 'Administrador',
    }));
    expect(errors.some(e => e.property === 'role')).toBe(true);
  });
});
