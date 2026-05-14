import { BaseEntity } from '@/common/domain/base.entity';
import { UserRole } from '@/common/enums/user-role.enum';
import { UserStatus } from '@/common/enums/user-status.enum';
import { Profile } from '@/modules/user/domain/entities/profile.entity';
export declare class User extends BaseEntity {
    email: string;
    password?: string;
    refreshToken?: string;
    verifyCode?: string;
    role: UserRole;
    status: UserStatus;
    profile?: Profile;
    constructor(partial: Partial<User>);
}
