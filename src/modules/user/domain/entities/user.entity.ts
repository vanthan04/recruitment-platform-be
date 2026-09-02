import { BaseEntity } from '@/common/domain/base.entity';
import { UserRole } from '@/common/enums/user-role.enum';
import { UserStatus } from '@/common/enums/user-status.enum';
import { Profile } from '@/modules/user/domain/entities/profile.entity';

export class User extends BaseEntity {
  email: string;
  password?: string;
  verifyCode?: string;
  role: UserRole;
  status: UserStatus;
  companyId?: string | null;
  profile?: Profile;

  constructor(partial: Partial<User>) {
    super();
    Object.assign(this, partial);
  }
}
