import { User } from '@/modules/user/domain/entities/user.entity';

export interface CreateUserOptions {
  email: string;
  password?: string;
  fullName?: string;
  verifyCode?: string;
  role?: string;
  status?: string;
}

export abstract class IAuthUserRepositoryPort {
  abstract findById(id: string): Promise<User | null>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract existsByEmail(email: string): Promise<boolean>;
  abstract save(data: CreateUserOptions): Promise<User>;
  abstract updateRefreshToken(id: string, refreshToken: string | null): Promise<void>;
  abstract findByVerifyCode(code: string): Promise<User | null>;
}
