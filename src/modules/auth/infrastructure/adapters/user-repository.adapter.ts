import { Injectable } from '@nestjs/common';
import {
  IAuthUserRepositoryPort,
  CreateUserOptions,
  AuthUserRecord,
} from '../../application/ports/auth-user-repository.port';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';
import { User } from '@/modules/user/domain/entities/user.entity';
import { Profile } from '@/modules/user/domain/entities/profile.entity';
import { UserRole } from '@/common/enums/user-role.enum';
import { UserStatus } from '@/common/enums/user-status.enum';

@Injectable()
export class AuthUserAdapter implements IAuthUserRepositoryPort {
  constructor(private readonly userRepository: IUserRepository) {}

  private toRecord(user: User | null): AuthUserRecord | null {
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      password: user.password,
      role: user.role,
      status: user.status,
    };
  }

  async findById(id: string): Promise<AuthUserRecord | null> {
    return this.toRecord(await this.userRepository.findById(id));
  }

  async findByEmail(email: string): Promise<AuthUserRecord | null> {
    return this.toRecord(await this.userRepository.findByEmail(email));
  }

  async findByGoogleId(googleId: string): Promise<AuthUserRecord | null> {
    return this.toRecord(await this.userRepository.findByGoogleId(googleId));
  }

  async findByFacebookId(facebookId: string): Promise<AuthUserRecord | null> {
    return this.toRecord(
      await this.userRepository.findByFacebookId(facebookId),
    );
  }

  async existsByEmail(email: string): Promise<boolean> {
    return this.userRepository.existsByEmail(email);
  }

  async save(data: CreateUserOptions): Promise<AuthUserRecord> {
    // Adapter mapping logically: Auth's "fullName" -> User Module's "profile.fullName"
    // `id` must be forwarded — its absence silently turned every update (verify
    // email, change/reset password) into an INSERT, colliding on the unique
    // email constraint instead of updating the existing row.
    const saved = await this.userRepository.save({
      id: data.id,
      email: data.email,
      password: data.password,
      googleId: data.googleId,
      facebookId: data.facebookId,
      role: data.role as UserRole | undefined,
      status: data.status as UserStatus | undefined,
      // `IUserRepository.save`'s `Partial<User>.profile` is typed as a full
      // `Profile`, but every call site (here and updateProfile/register
      // flows) only ever supplies a subset of its fields — the repository
      // only reads the specific fields it needs (see
      // user-prisma.repository.ts `save()`). Cast documents that gap rather
      // than papering over it with `any`.
      profile: data.fullName
        ? ({ fullName: data.fullName } as Profile)
        : undefined,
    });
    return this.toRecord(saved)!;
  }
}
