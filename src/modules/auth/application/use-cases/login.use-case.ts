import { Injectable, UnauthorizedException } from '@nestjs/common';
import { IAuthUserRepositoryPort } from '../ports/auth-user-repository.port';
import { LoginRequestDto } from '@/modules/auth/presentation/dtos/login-request.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class LoginUseCase {
  constructor(private readonly userRepository: IAuthUserRepositoryPort) {}

  async execute(dto: LoginRequestDto) {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password!);
    if (!isMatch) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    return user;
  }
}
