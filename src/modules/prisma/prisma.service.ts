import { Inject, Injectable, OnModuleInit, OnModuleDestroy, Optional } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Optional()
    @Inject('PRISMA_OPTIONS')
    private readonly options: any,
  ) {
    super(options);
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
