import { Injectable } from '@nestjs/common';
import { IAuthUserRepositoryPort, CreateUserOptions } from '../../application/ports/auth-user-repository.port';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';
import { User } from '@/modules/user/domain/entities/user.entity';

@Injectable()
export class AuthUserAdapter implements IAuthUserRepositoryPort {
  constructor(private readonly userRepository: IUserRepository) {}

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async existsByEmail(email: string): Promise<boolean> {
    return this.userRepository.existsByEmail(email);
  }

  async save(data: CreateUserOptions): Promise<User> {
    // Adapter mapping logically: Auth's "fullName" -> User Module's "profile.fullName"
    return this.userRepository.save({
      email: data.email,
      password: data.password,
      verifyCode: data.verifyCode,
      role: data.role as any,
      status: data.status as any,
      profile: data.fullName ? {
        fullName: data.fullName
      } as any : undefined
    });
  }

  async updateRefreshToken(id: string, refreshToken: string | null): Promise<void> {
    return this.userRepository.updateRefreshToken(id, refreshToken);
  }

  async findByVerifyCode(code: string): Promise<User | null> {
    return this.userRepository.findByVerifyCode(code);
  }
}
