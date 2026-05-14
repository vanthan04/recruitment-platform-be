import { Prisma } from '@prisma/client';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { BasePrismaRepository } from '@/common/infrastructure/base-prisma.repository';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';
import { User } from '@/modules/user/domain/entities/user.entity';
export declare class UserPrismaRepository extends BasePrismaRepository<Prisma.UserDelegate, {
    findUnique: Prisma.UserFindUniqueArgs;
    findMany: Prisma.UserFindManyArgs;
    create: Prisma.UserCreateArgs;
    update: Prisma.UserUpdateArgs;
    delete: Prisma.UserDeleteArgs;
}> implements IUserRepository {
    private readonly prismaService;
    constructor(prismaService: PrismaService);
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    findByIdWithProfile(id: string): Promise<User | null>;
    existsByEmail(email: string): Promise<boolean>;
    updateRefreshToken(id: string, refreshToken: string | null): Promise<void>;
    save(data: Partial<User>): Promise<User>;
    updateProfile(userId: string, profile: Partial<User['profile']>): Promise<void>;
    findByVerifyCode(code: string): Promise<User | null>;
    findAllPaginated(page: number, limit: number): Promise<{
        users: User[];
        total: number;
    }>;
}
