import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '@/modules/prisma/prisma.service';

function makeConfigService(): ConfigService {
  return {
    get: jest.fn().mockReturnValue('postgresql://localhost:5432/test'),
  } as unknown as ConfigService;
}

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

  it('reads DATABASE_URL from ConfigService rather than process.env', () => {
    const configService = makeConfigService();

    new PrismaService(undefined, configService);

    expect(configService.get).toHaveBeenCalledWith('DATABASE_URL');
  });

  it('connects to the database on module init', async () => {
    const service = new PrismaService(undefined, makeConfigService());

    await service.onModuleInit();

    expect(connectSpy).toHaveBeenCalledTimes(1);
  });

  it('disconnects from the database on module destroy', async () => {
    const service = new PrismaService(undefined, makeConfigService());

    await service.onModuleDestroy();

    expect(disconnectSpy).toHaveBeenCalledTimes(1);
  });
});
