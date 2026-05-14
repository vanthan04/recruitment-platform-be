import { Gender } from '@/common/enums/gender.enum';
export declare class UpdateProfileDto {
    fullName?: string;
    phoneNumber?: string;
    gender?: Gender;
    birthDate?: string;
    avatarUrl?: string;
}
