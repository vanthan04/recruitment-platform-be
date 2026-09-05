import { ArgumentsHost, HttpStatus } from '@nestjs/common';
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

  it('falls back to 500 for an unrecognized error', () => {
    const { filter } = makeFilter();
    const { host, status } = makeHost();

    filter.catch(new Error('boom'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
  });
});
