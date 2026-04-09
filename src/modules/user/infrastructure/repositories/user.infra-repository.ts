import { Injectable } from '@nestjs/common';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';
import { User } from '@/modules/user/domain/entities/user.entity';
import { UserPrismaRepository } from '@/modules/user/infrastructure/persistence/prisma/user-prisma.repository';
import { UserMapper } from '@/modules/user/infrastructure/persistence/mappers/user.mapper';
import { UserRole } from '@/common/enums/user-role.enum';
import { UserStatus } from '@/common/enums/user-status.enum';

@Injectable()
export class UserInfraRepository implements IUserRepository {
  constructor(private readonly userRepo: UserPrismaRepository) { }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.userRepo.findWithProfile(email);
    return UserMapper.toDomain(user);
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.userRepo.findUnique({
      where: { id },
      include: { profile: true },
    });
    return UserMapper.toDomain(user);
  }

  async findByIdWithProfile(id: string): Promise<User | null> {
    const user = await this.userRepo.findUnique({
      where: { id },
      include: {
        profile: {
          include: { addresses: true },
        },
      },
    });
    return UserMapper.toDomain(user);
  }

  async updateRefreshToken(id: string, refreshToken: string | null): Promise<void> {
    await this.userRepo.update({
      where: { id },
      data: { refreshToken },
    });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const user = await this.userRepo.findUnique({
      where: { email },
    });
    return !!user;
  }

  async save(data: Partial<User>): Promise<User> {
    if (data.id) {
      const updated = await this.userRepo.update({
        where: { id: data.id },
        data: {
          email: data.email,
          password: data.password,
          refreshToken: data.refreshToken,
          verifyCode: data.verifyCode,
          role: data.role as any,
          status: data.status as any,
          profile: data.profile ? {
            upsert: {
              create: {
                fullName: data.profile.fullName || '',
                phoneNumber: data.profile.phoneNumber,
                gender: data.profile.gender as any,
                birthDate: data.profile.birthDate,
                avatarUrl: data.profile.avatarUrl,
              },
              update: {
                fullName: data.profile.fullName,
                phoneNumber: data.profile.phoneNumber,
                gender: data.profile.gender as any,
                birthDate: data.profile.birthDate,
                avatarUrl: data.profile.avatarUrl,
              }
            }
          } : undefined
        },
        include: { profile: true }
      });
      return UserMapper.toDomain(updated)!;
    }

    const created = await this.userRepo.create({
      data: {
        email: data.email!,
        password: data.password!,
        refreshToken: data.refreshToken,
        verifyCode: data.verifyCode,
        role: (data.role as any) || UserRole.USER,
        status: (data.status as any) || UserStatus.PENDING,
        profile: {
          create: {
            fullName: data.profile?.fullName || '',
            phoneNumber: data.profile?.phoneNumber,
            gender: data.profile?.gender as any,
          },
        },
      },
      include: { profile: true },
    });
    return UserMapper.toDomain(created)!;
  }

  async updateProfile(userId: string, profile: Partial<User['profile']>): Promise<void> {
    await this.userRepo.update({
      where: { id: userId },
      data: {
        profile: {
          update: {
            fullName: profile?.fullName,
            phoneNumber: profile?.phoneNumber,
            gender: profile?.gender as any,
            birthDate: profile?.birthDate,
            avatarUrl: profile?.avatarUrl,
            wishList: profile?.wishList as any,
          }
        }
      }
    });
  }

  async findByVerifyCode(code: string): Promise<User | null> {
    const user = await this.userRepo.findByVerifyCode(code);
    return UserMapper.toDomain(user);
  }

  async findAllPaginated(page: number, limit: number): Promise<{ users: User[]; total: number }> {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.userRepo.findMany({
        skip,
        take: limit,
        include: { profile: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.userRepo.count(),
    ]);

    return {
      users: users.map(user => UserMapper.toDomain(user)!),
      total,
    };
  }
}
