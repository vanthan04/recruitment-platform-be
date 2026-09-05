export interface StoredOauthLoginCode {
  id: string;
  userId: string;
  codeHash: string;
  expiresAt: Date;
  usedAt: Date | null;
}

export abstract class IOauthLoginCodeRepositoryPort {
  abstract create(
    userId: string,
    codeHash: string,
    expiresAt: Date,
  ): Promise<void>;
  abstract findValidByHash(
    codeHash: string,
  ): Promise<StoredOauthLoginCode | null>;
  abstract markUsed(id: string): Promise<void>;
}
