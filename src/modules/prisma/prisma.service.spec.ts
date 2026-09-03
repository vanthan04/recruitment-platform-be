import { PrismaClient } from '@prisma/client';
import { PrismaService } from '@/modules/prisma/prisma.service';

describe('PrismaService', () => {
  let connectSpy: jest.SpyInstance;
  let disconnectSpy: jest.SpyInstance;

  beforeEach(() => {
    connectSpy = jest
      .spyOn(PrismaClient.prototype, '$connect')
      .mockResolvedValue(undefined as any);
    disconnectSpy = jest
      .spyOn(PrismaClient.prototype, '$disconnect')
      .mockResolvedValue(undefined as any);
  });

  afterEach(() => {
    connectSpy.mockRestore();
    disconnectSpy.mockRestore();
  });

  it('connects to the database on module init', async () => {
    const service = new PrismaService(undefined);

    await service.onModuleInit();

    expect(connectSpy).toHaveBeenCalledTimes(1);
  });

  it('disconnects from the database on module destroy', async () => {
    const service = new PrismaService(undefined);

    await service.onModuleDestroy();

    expect(disconnectSpy).toHaveBeenCalledTimes(1);
  });
});
