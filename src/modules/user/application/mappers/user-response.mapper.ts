import { User } from '@/modules/user/domain/entities/user.entity';
import {
  ProfileResponseDto,
  UserResponseDto,
} from '@/modules/user/application/dto/user-response.dto';

export class UserResponseMapper {
  static toDto(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.email = user.email;
    dto.role = user.role;
    dto.status = user.status;
    dto.companyId = user.companyId;
    dto.googleId = user.googleId;
    dto.facebookId = user.facebookId;
    dto.createdAt = user.createdAt;
    dto.updatedAt = user.updatedAt;
    if (user.profile) {
      const profile = new ProfileResponseDto();
      profile.fullName = user.profile.fullName;
      profile.birthDate = user.profile.birthDate;
      profile.gender = user.profile.gender;
      profile.phoneNumber = user.profile.phoneNumber;
      profile.avatarUrl = user.profile.avatarUrl;
      profile.headline = user.profile.headline;
      profile.summary = user.profile.summary;
      dto.profile = profile;
    }
    return dto;
  }

  static toDtoList(users: User[]): UserResponseDto[] {
    return users.map(UserResponseMapper.toDto);
  }
}
