import { VerificationTokenType } from '@/common/enums/verification-token-type.enum';

export interface StoredVerificationToken {
  id: string;
  userId: string;
  type: VerificationTokenType;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
}

export abstract class IVerificationTokenRepositoryPort {
  abstract create(
    userId: string,
    type: VerificationTokenType,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void>;
  abstract findValidByHashAndType(
    tokenHash: string,
    type: VerificationTokenType,
  ): Promise<StoredVerificationToken | null>;
  abstract markUsed(id: string): Promise<void>;
}
