import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler, Command } from '@nestjs/cqrs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IAuthUserRepositoryPort } from '@/modules/auth/application/ports/auth-user-repository.port';
import { IVerificationTokenRepositoryPort } from '@/modules/auth/application/ports/verification-token-repository.port';
import { IRefreshTokenRepositoryPort } from '@/modules/auth/application/ports/refresh-token-repository.port';
import { VerificationTokenType } from '@/common/enums/verification-token-type.enum';
import { ResetPasswordDto } from '@/modules/auth/presentation/dtos/reset-password.dto';
import { InvalidVerificationCodeException } from '@/modules/auth/domain/exceptions/auth.exceptions';
import { hashToken } from '@/common/utils/token-hash.util';
import {
  USER_SESSION_REVOKED_EVENT,
  UserSessionRevokedEvent,
} from '@/modules/user/infrastructure/events/user-session-revoked.event';
import * as bcrypt from 'bcrypt';

export class ResetPasswordCommand extends Command<{ message: string }> {
  constructor(public readonly dto: ResetPasswordDto) {
    super();
  }
}

@Injectable()
@CommandHandler(ResetPasswordCommand)
export class ResetPasswordHandler implements ICommandHandler<
  ResetPasswordCommand,
  { message: string }
> {
  constructor(
    private readonly userRepository: IAuthUserRepositoryPort,
    private readonly verificationTokenRepository: IVerificationTokenRepositoryPort,
    private readonly refreshTokenRepository: IRefreshTokenRepositoryPort,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute({ dto }: ResetPasswordCommand): Promise<{ message: string }> {
    const token = await this.verificationTokenRepository.findValidByHashAndType(
      hashToken(dto.code),
      VerificationTokenType.PASSWORD_RESET,
    );
    if (!token) {
      throw new InvalidVerificationCodeException();
    }

    const user = await this.userRepository.findById(token.userId);
    if (!user) {
      throw new InvalidVerificationCodeException();
    }

    await this.verificationTokenRepository.markUsed(token.id);

    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(dto.newPassword, salt);
    await this.userRepository.save(user);

    // A password reset is triggered from a "forgot password" flow that is
    // itself a common account-recovery-after-compromise path — revoke every
    // existing session rather than leaving a possibly-stolen one alive.
    await this.refreshTokenRepository.revokeAllForUser(user.id);
    this.eventEmitter.emit(
      USER_SESSION_REVOKED_EVENT,
      new UserSessionRevokedEvent(user.id),
    );

    return {
      message: 'Password has been changed successfully',
    };
  }
}
