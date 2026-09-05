import { BaseEntity } from '@/common/domain/base.entity';
import { UserRole } from '@/common/enums/user-role.enum';
import { UserStatus } from '@/common/enums/user-status.enum';
import { Profile } from '@/modules/user/domain/entities/profile.entity';

export class User extends BaseEntity {
  email: string;
  password?: string;
  googleId: string | null;
  facebookId: string | null;
  role: UserRole;
  status: UserStatus;
  companyId?: string | null;
  profile?: Profile;

  constructor(partial: Partial<User>) {
    super();
    Object.assign(this, partial);
    this.googleId = partial.googleId ?? null;
    this.facebookId = partial.facebookId ?? null;
  }

  changeStatus(newStatus: UserStatus): void {
    this.status = newStatus;
  }

  changeRole(newRole: UserRole): void {
    this.role = newRole;
  }
}
