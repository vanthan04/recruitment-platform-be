import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IAuthUserRepositoryPort } from '@/modules/auth/application/ports/auth-user-repository.port';
import { LoginRequestDto } from '@/modules/auth/presentation/dtos/login-request.dto';
import { InvalidCredentialsException } from '@/modules/auth/domain/exceptions/auth.exceptions';
import * as bcrypt from 'bcrypt';

export class LoginQuery {
  constructor(public readonly dto: LoginRequestDto) {}
}

@Injectable()
@QueryHandler(LoginQuery)
export class LoginHandler implements IQueryHandler<LoginQuery, any> {
  constructor(private readonly userRepository: IAuthUserRepositoryPort) {}

  async execute({ dto }: LoginQuery): Promise<any> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new InvalidCredentialsException();
    }

    const isMatch = await bcrypt.compare(dto.password, user.password!);
    if (!isMatch) {
      throw new InvalidCredentialsException();
    }

    return user;
  }
}
