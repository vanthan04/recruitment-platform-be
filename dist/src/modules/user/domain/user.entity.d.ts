import { BaseEntity } from '../../../common/domain/base.entity';
export declare class User extends BaseEntity {
    email: string;
    password?: string;
    fullName?: string;
    refreshToken?: string;
    verifyCode?: string;
    role: string;
    status: string;
    constructor(partial: Partial<User>);
}
