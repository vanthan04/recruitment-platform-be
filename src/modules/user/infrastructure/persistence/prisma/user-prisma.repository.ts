import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { BasePrismaRepository } from '@/common/infrastructure/base-prisma.repository';

@Injectable()
export class UserPrismaRepository extends BasePrismaRepository<
  Prisma.UserDelegate,
  {
    findUnique: Prisma.UserFindUniqueArgs;
    findMany: Prisma.UserFindManyArgs;
    create: Prisma.UserCreateArgs;
    update: Prisma.UserUpdateArgs;
    delete: Prisma.UserDeleteArgs;
  }
> {
  constructor(private readonly prismaService: PrismaService) {
    super(prismaService.user);
  }

  async findWithProfile(email: string) {
    return this.prismaService.user.findUnique({
      where: { email },
      include: { profile: true },
    });
  }

  async findByVerifyCode(code: string) {
    return this.prismaService.user.findFirst({
      where: { verifyCode: code },
      include: { profile: true },
    });
  }
}
