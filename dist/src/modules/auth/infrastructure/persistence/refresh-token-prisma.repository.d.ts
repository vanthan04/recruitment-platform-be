import { PrismaService } from '@/modules/prisma/prisma.service';
import { IRefreshTokenRepositoryPort, StoredRefreshToken } from '@/modules/auth/application/ports/refresh-token-repository.port';
export declare class RefreshTokenPrismaRepository implements IRefreshTokenRepositoryPort {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(userId: string, tokenHash: string, expiresAt: Date): Promise<void>;
    findValidByHash(tokenHash: string): Promise<StoredRefreshToken | null>;
    revokeByHash(userId: string, tokenHash: string): Promise<void>;
    revokeAllForUser(userId: string): Promise<void>;
}
