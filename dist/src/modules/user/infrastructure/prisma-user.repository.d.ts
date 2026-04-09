import { IUserRepository } from '../domain/user.repository';
import { User } from '../domain/user.entity';
import { PrismaService } from '../../../common/prisma/prisma.service';
export declare class PrismaUserRepository implements IUserRepository {
    private prisma;
    constructor(prisma: PrismaService);
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    updateRefreshToken(id: string, refreshToken: string | null): Promise<void>;
    existsByEmail(email: string): Promise<boolean>;
    save(data: Partial<User>): Promise<User>;
}
