import { Profile as PrismaProfile } from '@prisma/client';
import { Profile } from '@/modules/user/domain/entities/profile.entity';
import { Gender } from '@/common/enums/gender.enum';

export class ProfileMapper {
  static toDomain(raw: PrismaProfile | null | undefined): Profile | null {
    if (!raw) return null;

    return new Profile({
      id: raw.id,
      fullName: raw.fullName,
      // These columns are nullable in the DB (`string | null` / `Date |
      // null`) while the domain entity types them `| undefined`. Cast only
      // — preserves the exact raw value (including `null`) rather than
      // coercing it, matching this mapper's pre-existing runtime behavior.
      headline: raw.headline as string | undefined,
      summary: raw.summary as string | undefined,
      birthDate: raw.birthDate as Date | undefined,
      gender: raw.gender as Gender,
      phoneNumber: raw.phoneNumber as string | undefined,
      avatarUrl: raw.avatarUrl as string | undefined,
      userId: raw.userId,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}
