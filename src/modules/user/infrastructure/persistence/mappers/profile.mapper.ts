import { Profile } from '@/modules/user/domain/entities/profile.entity';
import { Gender } from '@/common/enums/gender.enum';

export class ProfileMapper {
  static toDomain(raw: any): Profile | null {
    if (!raw) return null;

    return new Profile({
      id: raw.id,
      fullName: raw.fullName,
      headline: raw.headline,
      summary: raw.summary,
      birthDate: raw.birthDate,
      gender: raw.gender as Gender,
      phoneNumber: raw.phoneNumber,
      avatarUrl: raw.avatarUrl,
      userId: raw.userId,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}
