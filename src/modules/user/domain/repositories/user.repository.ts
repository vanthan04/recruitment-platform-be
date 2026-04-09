import { User } from '@/modules/user/domain/entities/user.entity';

export abstract class IUserRepository {
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findById(id: string): Promise<User | null>;
  abstract findByIdWithProfile(id: string): Promise<User | null>;
  abstract existsByEmail(email: string): Promise<boolean>;
  abstract save(user: Partial<User>): Promise<User>;
  abstract updateProfile(userId: string, profile: Partial<User['profile']>): Promise<void>;
  abstract updateRefreshToken(id: string, refreshToken: string | null): Promise<void>;
  abstract findByVerifyCode(code: string): Promise<User | null>;
  abstract findAllPaginated(page: number, limit: number): Promise<{ users: User[]; total: number }>;
}
