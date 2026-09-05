import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { BasePrismaRepository } from '@/common/infrastructure/base-prisma.repository';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';
import { User } from '@/modules/user/domain/entities/user.entity';
import { UserMapper } from '@/modules/user/infrastructure/persistence/mappers/user.mapper';
import { UserRole } from '@/common/enums/user-role.enum';
import { UserStatus } from '@/common/enums/user-status.enum';
import { normalizePagination } from '@/common/utils/pagination.util';

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
      include: { profile: true, roleRef: true },
    });
    return UserMapper.toDomain(user);
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      include: { profile: true, roleRef: true },
    });
    return UserMapper.toDomain(user);
  }

  async findByIdWithProfile(id: string): Promise<User | null> {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      include: { profile: true, roleRef: true },
    });
    return UserMapper.toDomain(user);
  }

  async findManyByIdsWithProfile(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return [];
    const users = await this.prismaService.user.findMany({
      where: { id: { in: ids } },
      include: { profile: true, roleRef: true },
    });
    return users.map((u) => UserMapper.toDomain(u)!);
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const user = await this.prismaService.user.findUnique({
      where: { googleId },
      include: { profile: true, roleRef: true },
    });
    return UserMapper.toDomain(user);
  }

  async findByFacebookId(facebookId: string): Promise<User | null> {
    const user = await this.prismaService.user.findUnique({
      where: { facebookId },
      include: { profile: true, roleRef: true },
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
          // Role changes go through roleRef (the FK) — there is no more
          // `role` enum column to keep in sync.
          ...(data.role
            ? { roleRef: { connect: { name: data.role as any } } }
            : {}),
          // Guarded by `!== undefined` (not just truthy) so unrelated saves
          // (verify-email, reset-password, profile update) never silently
          // null out an already-linked social account.
          ...(data.googleId !== undefined ? { googleId: data.googleId } : {}),
          ...(data.facebookId !== undefined
            ? { facebookId: data.facebookId }
            : {}),
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
        include: { profile: true, roleRef: true },
      });
      return UserMapper.toDomain(updated)!;
    }

    const role = (data.role as any) || UserRole.CANDIDATE;
    const created = await this.prismaService.user.create({
      data: {
        email: data.email!,
        password: data.password!,
        googleId: data.googleId ?? undefined,
        facebookId: data.facebookId ?? undefined,
        // roleId is resolved from the role name via the unique constraint on
        // Role.name, so callers here don't need to know the role's id.
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
      include: { profile: true, roleRef: true },
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

  async updateCompanyId(
    userId: string,
    companyId: string | null,
  ): Promise<void> {
    await this.prismaService.user.update({
      where: { id: userId },
      data: { companyId },
    });
  }

  async countActiveAdmins(): Promise<number> {
    return this.prismaService.user.count({
      where: {
        status: UserStatus.ACTIVE,
        roleRef: { name: UserRole.ADMIN },
      },
    });
  }

  async findAllPaginated(
    page: number,
    limit: number,
  ): Promise<{ users: User[]; total: number }> {
    const normalized = normalizePagination({ page, limit });
    const [users, total] = await Promise.all([
      this.prismaService.user.findMany({
        skip: normalized.skip,
        take: normalized.limit,
        include: { profile: true, roleRef: true },
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
