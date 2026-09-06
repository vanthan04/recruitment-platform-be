import {
  Inject,
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// What app.module.ts's `PrismaModule.forRoot(...)` actually passes: Prisma
// Client constructor options minus `adapter`, which PrismaService always
// supplies itself (below) rather than letting a caller override it.
export type PrismaClientOptions = Omit<Prisma.PrismaClientOptions, 'adapter'>;

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(
    @Optional()
    @Inject('PRISMA_OPTIONS')
    private readonly options: PrismaClientOptions | undefined,
    // Read as a plain parameter, not `this.configService` — it has to be
    // available before `super()` runs, and `this` doesn't exist yet.
    configService: ConfigService,
  ) {
    const adapter = new PrismaPg({
      connectionString: configService.get<string>('DATABASE_URL'),
    });
    super({ ...options, adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
