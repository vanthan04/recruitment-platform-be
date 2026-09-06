import { DynamicModule, Global, Module } from '@nestjs/common';
import { PrismaService, PrismaClientOptions } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {
  static forRoot(options: PrismaClientOptions): DynamicModule {
    return {
      module: PrismaModule,
      providers: [
        {
          provide: 'PRISMA_OPTIONS',
          useValue: options,
        },
        PrismaService,
      ],
      exports: [PrismaService],
    };
  }
}
