import { User } from '@/modules/user/domain/entities/user.entity';
import { UserRole } from '@/common/enums/user-role.enum';
import { UserStatus } from '@/common/enums/user-status.enum';
import { ProfileMapper } from './profile.mapper';

export class UserMapper {
  static toDomain(raw: any): User | null {
    if (!raw) return null;

    return new User({
      id: raw.id,
      email: raw.email,
      password: raw.password,
      role: raw.roleRef.name as UserRole,
      status: raw.status as UserStatus,
      companyId: raw.companyId ?? null,
      profile: raw.profile ? ProfileMapper.toDomain(raw.profile)! : undefined,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}
