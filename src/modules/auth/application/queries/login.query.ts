import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler, Query } from '@nestjs/cqrs';
import {
  IAuthUserRepositoryPort,
  AuthUserRecord,
} from '@/modules/auth/application/ports/auth-user-repository.port';
import { ILoginAttemptTrackerPort } from '@/modules/auth/application/ports/login-attempt-tracker.port';
import { LoginRequestDto } from '@/modules/auth/presentation/dtos/login-request.dto';
import {
  InvalidCredentialsException,
  AccountBlockedException,
  AccountLockedException,
  EmailNotVerifiedException,
} from '@/modules/auth/domain/exceptions/auth.exceptions';
import { UserStatus } from '@/common/enums/user-status.enum';
import * as bcrypt from 'bcrypt';

export class LoginQuery extends Query<AuthUserRecord> {
  constructor(public readonly dto: LoginRequestDto) {
    super();
  }
}

// Precomputed once at module load so a lookup miss (unknown email, or a
// social-only account with no password) still pays a real bcrypt.compare
// cost — otherwise the missing hash compare short-circuits, and the
// latency gap versus a wrong-password attempt on a real account leaks
// which emails are registered.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('no-such-account-timing-guard', 10);

@Injectable()
@QueryHandler(LoginQuery)
export class LoginHandler implements IQueryHandler<LoginQuery, AuthUserRecord> {
  constructor(
    private readonly userRepository: IAuthUserRepositoryPort,
    private readonly loginAttemptTracker: ILoginAttemptTrackerPort,
  ) {}

  async execute({ dto }: LoginQuery): Promise<AuthUserRecord> {
    if (await this.loginAttemptTracker.isLocked(dto.email)) {
      throw new AccountLockedException();
    }

    const user = await this.userRepository.findByEmail(dto.email);

    const isMatch = await bcrypt.compare(
      dto.password,
      user?.password ?? DUMMY_PASSWORD_HASH,
    );
    if (!user || !user.password || !isMatch) {
      await this.loginAttemptTracker.registerFailure(dto.email);
      throw new InvalidCredentialsException();
    }

    await this.loginAttemptTracker.resetOnSuccess(dto.email);

    if (user.status === UserStatus.BLOCKED) {
      throw new AccountBlockedException();
    }
    if (user.status === UserStatus.PENDING) {
      throw new EmailNotVerifiedException();
    }

    return user;
  }
}
