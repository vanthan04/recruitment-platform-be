export interface StoredRefreshToken {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    revokedAt: Date | null;
}
export declare abstract class IRefreshTokenRepositoryPort {
    abstract create(userId: string, tokenHash: string, expiresAt: Date): Promise<void>;
    abstract findValidByHash(tokenHash: string): Promise<StoredRefreshToken | null>;
    abstract revokeByHash(userId: string, tokenHash: string): Promise<void>;
    abstract revokeAllForUser(userId: string): Promise<void>;
}
