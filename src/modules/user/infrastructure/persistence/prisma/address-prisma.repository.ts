import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { BasePrismaRepository } from '@/common/infrastructure/base-prisma.repository';

@Injectable()
export class AddressPrismaRepository extends BasePrismaRepository<
  Prisma.AddressDelegate,
  {
    findUnique: Prisma.AddressFindUniqueArgs;
    findMany: Prisma.AddressFindManyArgs;
    create: Prisma.AddressCreateArgs;
    update: Prisma.AddressUpdateArgs;
    delete: Prisma.AddressDeleteArgs;
  }
> {
  constructor(private readonly prismaService: PrismaService) {
    super(prismaService.address);
  }
}
