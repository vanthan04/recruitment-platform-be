import { DynamicModule, Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {
  static forRoot(options: any): DynamicModule {
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
