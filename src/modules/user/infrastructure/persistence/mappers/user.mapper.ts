import { Prisma } from '@prisma/client';
import { User } from '@/modules/user/domain/entities/user.entity';
import { UserRole } from '@/common/enums/user-role.enum';
import { UserStatus } from '@/common/enums/user-status.enum';
import { ProfileMapper } from './profile.mapper';

// The mapper is fed by every UserPrismaRepository read/write method, and all
// of them include the same two relations (`profile`, `roleRef`) — see
// user-prisma.repository.ts.
type RawUser = Prisma.UserGetPayload<{
  include: { profile: true; roleRef: true };
}>;

export class UserMapper {
  static toDomain(raw: RawUser | null | undefined): User | null {
    if (!raw) return null;

    return new User({
      id: raw.id,
      email: raw.email,
      // Prisma types this `string | null`; the domain entity types it
      // `string | undefined`. Cast only — preserves the exact raw value
      // (including `null` for social-login users) rather than coercing it,
      // matching the pre-existing runtime behavior of this assignment.
      password: raw.password as string | undefined,
      googleId: raw.googleId ?? null,
      facebookId: raw.facebookId ?? null,
      role: raw.roleRef.name as UserRole,
      status: raw.status as UserStatus,
      companyId: raw.companyId ?? null,
      profile: raw.profile ? ProfileMapper.toDomain(raw.profile)! : undefined,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}
