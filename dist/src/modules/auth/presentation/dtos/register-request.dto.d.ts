import { UserRole } from '@/common/enums/user-role.enum';
export declare class RegisterRequestDto {
    email: string;
    password: string;
    fullName: string;
    role: UserRole;
}
