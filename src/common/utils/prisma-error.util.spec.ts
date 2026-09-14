import { Prisma } from '@prisma/client';
import {
  isUniqueConstraintViolation,
  uniqueConstraintName,
} from '@/common/utils/prisma-error.util';

function makeP2002(meta: Record<string, unknown>) {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: 'test',
    meta,
  });
}

describe('isUniqueConstraintViolation', () => {
  it('is true for a P2002 PrismaClientKnownRequestError', () => {
    expect(isUniqueConstraintViolation(makeP2002({}))).toBe(true);
  });

  it('is false for a different Prisma error code', () => {
    const err = new Prisma.PrismaClientKnownRequestError('Not found', {
      code: 'P2025',
      clientVersion: 'test',
    });
    expect(isUniqueConstraintViolation(err)).toBe(false);
  });

  it('is false for a plain Error', () => {
    expect(isUniqueConstraintViolation(new Error('boom'))).toBe(false);
  });

  it('is false for a non-error value', () => {
    expect(isUniqueConstraintViolation(undefined)).toBe(false);
    expect(isUniqueConstraintViolation('P2002')).toBe(false);
  });
});

describe('uniqueConstraintName', () => {
  it('reads the constraint name from the @prisma/adapter-pg shape this app actually produces', () => {
    const err = makeP2002({
      driverAdapterError: {
        cause: { constraint: { index: 'companies_slug_key' } },
      },
    });

    expect(uniqueConstraintName(err)).toBe('companies_slug_key');
  });

  it('falls back to the classic target-array shape when present', () => {
    const err = makeP2002({ target: ['ownerId'] });

    expect(uniqueConstraintName(err)).toBe('ownerId');
  });

  it('falls back to a classic string target', () => {
    const err = makeP2002({ target: 'userId_jobId' });

    expect(uniqueConstraintName(err)).toBe('userId_jobId');
  });

  it('returns undefined when neither shape is present', () => {
    const err = makeP2002({});

    expect(uniqueConstraintName(err)).toBeUndefined();
  });
});
