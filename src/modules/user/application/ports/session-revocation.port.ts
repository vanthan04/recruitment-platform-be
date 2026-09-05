/**
 * Lets the user module end a user's active sessions without depending on the
 * auth module (which itself imports UserModule — depending on it back would
 * be circular). Implemented directly against the `refresh_tokens` table via
 * Prisma, mirroring `RefreshTokenPrismaRepository.revokeAllForUser`.
 */
export abstract class ISessionRevocationPort {
  abstract revokeAllForUser(userId: string): Promise<void>;
}
