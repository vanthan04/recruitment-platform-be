import { ServiceUnavailableException } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaService } from '@/modules/prisma/prisma.service';

describe('AppController (healthcheck)', () => {
  let controller: AppController;
  let prisma: { $queryRaw: jest.Mock };

  beforeEach(() => {
    prisma = { $queryRaw: jest.fn() };
    controller = new AppController(prisma as unknown as PrismaService);
  });

  it('returns success when the database is reachable', async () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    const result = await controller.check();

    expect(result.success).toBe(true);
  });

  it('throws ServiceUnavailableException (503) when the database is not reachable', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('connection refused'));

    await expect(controller.check()).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('does not leak the raw database error in the thrown exception', async () => {
    prisma.$queryRaw.mockRejectedValue(
      new Error('password authentication failed for user "postgres"'),
    );

    await expect(controller.check()).rejects.toMatchObject({
      message: 'Database is not reachable',
    });
  });
});
