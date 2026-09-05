import { UserRole } from '@/common/enums/user-role.enum';
import { UserStatus } from '@/common/enums/user-status.enum';

export interface CreateUserOptions {
  id?: string;
  email: string;
  password?: string;
  fullName?: string;
  role?: string;
  status?: string;
  googleId?: string | null;
  facebookId?: string | null;
}

/** Local, auth-scoped shape — only the fields auth flows actually touch (no leaked `user` module entity). */
export interface AuthUserRecord {
  id: string;
  email: string;
  password?: string;
  role: UserRole;
  status: UserStatus;
}

export abstract class IAuthUserRepositoryPort {
  abstract findById(id: string): Promise<AuthUserRecord | null>;
  abstract findByEmail(email: string): Promise<AuthUserRecord | null>;
  abstract findByGoogleId(googleId: string): Promise<AuthUserRecord | null>;
  abstract findByFacebookId(facebookId: string): Promise<AuthUserRecord | null>;
  abstract existsByEmail(email: string): Promise<boolean>;
  abstract save(data: CreateUserOptions): Promise<AuthUserRecord>;
}
