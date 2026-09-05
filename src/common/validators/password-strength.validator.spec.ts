import { validate } from 'class-validator';
import {
  IsStrongPassword,
  PASSWORD_MIN_LENGTH,
} from './password-strength.validator';

class TestDto {
  @IsStrongPassword()
  password: string;
}

async function validatePassword(password: string): Promise<boolean> {
  const dto = new TestDto();
  dto.password = password;
  const errors = await validate(dto);
  return errors.length === 0;
}

describe('IsStrongPassword', () => {
  it('exposes a minimum length of 8', () => {
    expect(PASSWORD_MIN_LENGTH).toBe(8);
  });

  it('accepts a password with letters and digits', async () => {
    expect(await validatePassword('password123')).toBe(true);
  });

  it('rejects an all-digit password', async () => {
    expect(await validatePassword('12345678')).toBe(false);
  });

  it('rejects an all-letter password', async () => {
    expect(await validatePassword('passwordonly')).toBe(false);
  });

  it('rejects a non-string value', async () => {
    const dto = new TestDto();
    (dto as any).password = 12345678;
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
