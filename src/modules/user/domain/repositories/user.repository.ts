import { User } from '@/modules/user/domain/entities/user.entity';

export abstract class IUserRepository {
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findById(id: string): Promise<User | null>;
  abstract findByIdWithProfile(id: string): Promise<User | null>;
  abstract findManyByIdsWithProfile(ids: string[]): Promise<User[]>;
  abstract findByGoogleId(googleId: string): Promise<User | null>;
  abstract findByFacebookId(facebookId: string): Promise<User | null>;
  abstract existsByEmail(email: string): Promise<boolean>;
  abstract save(user: Partial<User>): Promise<User>;
  abstract updateProfile(
    userId: string,
    profile: Partial<User['profile']>,
  ): Promise<void>;
  abstract findAllPaginated(
    page: number,
    limit: number,
  ): Promise<{ users: User[]; total: number }>;
  abstract updateCompanyId(
    userId: string,
    companyId: string | null,
  ): Promise<void>;
  /** Used to block a self-lockout: refuse to block/demote the last one. */
  abstract countActiveAdmins(): Promise<number>;
}
