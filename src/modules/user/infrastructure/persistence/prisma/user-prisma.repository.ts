import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { BasePrismaRepository } from '@/common/infrastructure/base-prisma.repository';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';
import { User } from '@/modules/user/domain/entities/user.entity';
import { UserMapper } from '@/modules/user/infrastructure/persistence/mappers/user.mapper';
import { UserRole } from '@/common/enums/user-role.enum';
import { UserStatus } from '@/common/enums/user-status.enum';

@Injectable()
export class UserPrismaRepository
  extends BasePrismaRepository<
    Prisma.UserDelegate,
    {
      findUnique: Prisma.UserFindUniqueArgs;
      findMany: Prisma.UserFindManyArgs;
      create: Prisma.UserCreateArgs;
      update: Prisma.UserUpdateArgs;
      delete: Prisma.UserDeleteArgs;
    }
  >
  implements IUserRepository
{
  constructor(private readonly prismaService: PrismaService) {
    super(prismaService.user);
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prismaService.user.findUnique({
      where: { email },
      include: { profile: true },
    });
    return UserMapper.toDomain(user);
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      include: { profile: true },
    });
    return UserMapper.toDomain(user);
  }

  async findByIdWithProfile(id: string): Promise<User | null> {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      include: { profile: true },
    });
    return UserMapper.toDomain(user);
  }

  async existsByEmail(email: string): Promise<boolean> {
    const user = await this.prismaService.user.findUnique({
      where: { email },
      select: { id: true },
    });
    return !!user;
  }

  async save(data: Partial<User>): Promise<User> {
    if (data.id) {
      const updated = await this.prismaService.user.update({
        where: { id: data.id },
        data: {
          email: data.email,
          password: data.password,
          verifyCode: data.verifyCode,
          role: data.role as any,
          status: data.status as any,
          profile: data.profile
            ? {
                upsert: {
                  create: {
                    fullName: data.profile.fullName || '',
                    phoneNumber: data.profile.phoneNumber,
                    gender: data.profile.gender as any,
                    birthDate: data.profile.birthDate,
                    avatarUrl: data.profile.avatarUrl,
                    headline: data.profile.headline,
                    summary: data.profile.summary,
                  },
                  update: {
                    fullName: data.profile.fullName,
                    phoneNumber: data.profile.phoneNumber,
                    gender: data.profile.gender as any,
                    birthDate: data.profile.birthDate,
                    avatarUrl: data.profile.avatarUrl,
                    headline: data.profile.headline,
                    summary: data.profile.summary,
                  },
                },
              }
            : undefined,
        },
        include: { profile: true },
      });
      return UserMapper.toDomain(updated)!;
    }

    const role = (data.role as any) || UserRole.CANDIDATE;
    const created = await this.prismaService.user.create({
      data: {
        email: data.email!,
        password: data.password!,
        verifyCode: data.verifyCode,
        // `role` stays the operational field the rest of the app reads/writes;
        // roleRef/roleId is the RBAC join, connected by the role's unique name
        // so callers here don't need to know its id. A DB trigger additionally
        // keeps roleId in sync whenever `role` is updated later (see the
        // add_rbac_system migration), so this connect only has to be correct
        // at creation time.
        role,
        roleRef: { connect: { name: role } },
        status: (data.status as any) || UserStatus.PENDING,
        profile: {
          create: {
            fullName: data.profile?.fullName || '',
            phoneNumber: data.profile?.phoneNumber,
            gender: data.profile?.gender as any,
            headline: data.profile?.headline,
            summary: data.profile?.summary,
          },
        },
      },
      include: { profile: true },
    });
    return UserMapper.toDomain(created)!;
  }

  async updateProfile(
    userId: string,
    profile: Partial<User['profile']>,
  ): Promise<void> {
    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        profile: {
          update: {
            fullName: profile?.fullName,
            phoneNumber: profile?.phoneNumber,
            gender: profile?.gender as any,
            birthDate: profile?.birthDate,
            avatarUrl: profile?.avatarUrl,
            headline: profile?.headline,
            summary: profile?.summary,
          },
        },
      },
    });
  }

  async findByVerifyCode(code: string): Promise<User | null> {
    const user = await this.prismaService.user.findFirst({
      where: { verifyCode: code },
      include: { profile: true },
    });
    return UserMapper.toDomain(user);
  }

  async updateCompanyId(
    userId: string,
    companyId: string | null,
  ): Promise<void> {
    await this.prismaService.user.update({
      where: { id: userId },
      data: { companyId },
    });
  }

  async findAllPaginated(
    page: number,
    limit: number,
  ): Promise<{ users: User[]; total: number }> {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prismaService.user.findMany({
        skip,
        take: limit,
        include: { profile: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prismaService.user.count(),
    ]);

    return {
      users: users.map((user) => UserMapper.toDomain(user)!),
      total,
    };
  }
}
