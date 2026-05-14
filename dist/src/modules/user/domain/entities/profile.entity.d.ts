import { BaseEntity } from '@/common/domain/base.entity';
import { Gender } from '@/common/enums/gender.enum';
export declare class Profile extends BaseEntity {
    fullName: string;
    birthDate?: Date;
    gender?: Gender;
    phoneNumber?: string;
    avatarUrl?: string;
    headline?: string;
    summary?: string;
    userId: string;
    constructor(partial: Partial<Profile>);
}
