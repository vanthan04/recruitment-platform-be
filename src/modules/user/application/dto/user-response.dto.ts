import { UserRole } from '@/common/enums/user-role.enum';
import { UserStatus } from '@/common/enums/user-status.enum';
import { Gender } from '@/common/enums/gender.enum';

export class ProfileResponseDto {
  fullName: string;
  birthDate?: Date;
  gender?: Gender;
  phoneNumber?: string;
  avatarUrl?: string;
  headline?: string;
  summary?: string;
}

export class UserResponseDto {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  companyId?: string | null;
  googleId: string | null;
  facebookId: string | null;
  profile?: ProfileResponseDto;
  createdAt: Date;
  updatedAt: Date;
}
