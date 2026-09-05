import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IAuthUserRepositoryPort } from '@/modules/auth/application/ports/auth-user-repository.port';
import { LoginRequestDto } from '@/modules/auth/presentation/dtos/login-request.dto';
import {
  InvalidCredentialsException,
  AccountBlockedException,
  EmailNotVerifiedException,
} from '@/modules/auth/domain/exceptions/auth.exceptions';
import { UserStatus } from '@/common/enums/user-status.enum';
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

    if (user.status === UserStatus.BLOCKED) {
      throw new AccountBlockedException();
    }
    if (user.status === UserStatus.PENDING) {
      throw new EmailNotVerifiedException();
    }

    return user;
  }
}
