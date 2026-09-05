import {
  ArgumentsHost,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { GlobalExceptionFilter } from '@/common/filters/http-exception.filter';
import {
  BusinessRuleViolationException,
  DuplicateEntityException,
} from '@/common/exceptions/domain.exception';

function makeHost() {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const response = { status };
  const request = { originalUrl: '/api/v1/companies', method: 'POST', id: 'req-1' };

  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;

  return { host, status, json };
}

function makeFilter() {
  const logger = { setContext: jest.fn(), error: jest.fn(), warn: jest.fn() };
  const filter = new GlobalExceptionFilter(logger as any);
  return { filter, logger };
}

describe('GlobalExceptionFilter', () => {
  it('maps a DomainException subclass to its HTTP status and code', () => {
    const { filter } = makeFilter();
    const { host, status, json } = makeHost();

    filter.catch(new BusinessRuleViolationException('nope', 'NOPE'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'nope', code: 'NOPE' }),
    );
  });

  it('maps a raw DuplicateEntityException to 409', () => {
    const { filter } = makeFilter();
    const { host, status } = makeHost();

    filter.catch(new DuplicateEntityException('Company', 'ownerId'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
  });

  it('maps a Prisma P2002 unique-constraint error to 409 DUPLICATE_ENTITY instead of a raw 500', () => {
    const { filter } = makeFilter();
    const { host, status, json } = makeHost();

    const prismaError = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      { code: 'P2002', clientVersion: 'test', meta: { target: ['ownerId'] } },
    );

    filter.catch(prismaError, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'DUPLICATE_ENTITY',
        message: 'A record with this ownerId already exists',
      }),
    );
  });

  it('maps a Prisma P2025 "record not found" error to 404 instead of a raw 500', () => {
    const { filter } = makeFilter();
    const { host, status, json } = makeHost();

    const prismaError = new Prisma.PrismaClientKnownRequestError(
      'An operation failed because it depends on one or more records that were required but not found.',
      { code: 'P2025', clientVersion: 'test' },
    );

    filter.catch(prismaError, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'ENTITY_NOT_FOUND' }),
    );
  });

  it('maps a Prisma P2003 foreign-key violation to 400 instead of a raw 500', () => {
    const { filter } = makeFilter();
    const { host, status, json } = makeHost();

    const prismaError = new Prisma.PrismaClientKnownRequestError(
      'Foreign key constraint failed on the field: `jobs_categoryId_fkey`',
      { code: 'P2003', clientVersion: 'test' },
    );

    filter.catch(prismaError, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'INVALID_REFERENCE' }),
    );
  });

  it('does not leak the raw Prisma error message for an unmapped Prisma error code', () => {
    const { filter } = makeFilter();
    const { host, status, json } = makeHost();

    const prismaError = new Prisma.PrismaClientKnownRequestError(
      'Some internal Prisma detail mentioning table/column names',
      { code: 'P2099', clientVersion: 'test' },
    );

    filter.catch(prismaError, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Internal server error' }),
    );
  });

  it('falls back to 500 for an unrecognized error, without leaking its message', () => {
    const { filter } = makeFilter();
    const { host, status, json } = makeHost();

    filter.catch(new Error('boom: internal db pool exhausted'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
      }),
    );
  });

  it('does not leak an unsafe message embedded in a 500-status HttpException (e.g. a raw AWS/SMTP error string)', () => {
    const { filter } = makeFilter();
    const { host, status, json } = makeHost();

    filter.catch(
      new InternalServerErrorException(
        'Failed to upload to S3: The AWS Access Key Id you provided does not exist',
      ),
      host,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Internal server error' }),
    );
  });

  it('leaves non-500 responses (e.g. a domain BusinessRuleViolationException) untouched by the 5xx sanitization', () => {
    const { filter } = makeFilter();
    const { host, json } = makeHost();

    filter.catch(new BusinessRuleViolationException('nope', 'NOPE'), host);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'nope', code: 'NOPE' }),
    );
  });
});
