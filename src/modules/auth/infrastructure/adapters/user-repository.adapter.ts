import { Injectable } from '@nestjs/common';
import {
  IAuthUserRepositoryPort,
  CreateUserOptions,
  AuthUserRecord,
} from '../../application/ports/auth-user-repository.port';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';
import { User } from '@/modules/user/domain/entities/user.entity';

@Injectable()
export class AuthUserAdapter implements IAuthUserRepositoryPort {
  constructor(private readonly userRepository: IUserRepository) {}

  private toRecord(user: User | null): AuthUserRecord | null {
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      password: user.password,
      verifyCode: user.verifyCode,
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
      verifyCode: data.verifyCode,
      role: data.role as any,
      status: data.status as any,
      profile: data.fullName
        ? ({
            fullName: data.fullName,
          } as any)
        : undefined,
    });
    return this.toRecord(saved)!;
  }

  async findByVerifyCode(code: string): Promise<AuthUserRecord | null> {
    return this.toRecord(await this.userRepository.findByVerifyCode(code));
  }
}
