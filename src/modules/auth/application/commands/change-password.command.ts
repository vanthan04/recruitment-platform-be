import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler, Command } from '@nestjs/cqrs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IAuthUserRepositoryPort } from '@/modules/auth/application/ports/auth-user-repository.port';
import { IRefreshTokenRepositoryPort } from '@/modules/auth/application/ports/refresh-token-repository.port';
import { ChangePasswordDto } from '@/modules/auth/presentation/dtos/change-password.dto';
import {
  UserNotFoundException,
  InvalidOldPasswordException,
} from '@/modules/auth/domain/exceptions/auth.exceptions';
import {
  USER_SESSION_REVOKED_EVENT,
  UserSessionRevokedEvent,
} from '@/modules/user/infrastructure/events/user-session-revoked.event';
import * as bcrypt from 'bcrypt';

export class ChangePasswordCommand extends Command<{ message: string }> {
  constructor(
    public readonly userId: string,
    public readonly dto: ChangePasswordDto,
  ) {
    super();
  }
}

@Injectable()
@CommandHandler(ChangePasswordCommand)
export class ChangePasswordHandler implements ICommandHandler<
  ChangePasswordCommand,
  { message: string }
> {
  constructor(
    private readonly userRepository: IAuthUserRepositoryPort,
    private readonly refreshTokenRepository: IRefreshTokenRepositoryPort,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute({
    userId,
    dto,
  }: ChangePasswordCommand): Promise<{ message: string }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }

    const isMatch = await bcrypt.compare(dto.oldPassword, user.password!);
    if (!isMatch) {
      throw new InvalidOldPasswordException();
    }

    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(dto.newPassword, salt);

    await this.userRepository.save(user);

    // A changed password is usually a reaction to a suspected compromise —
    // revoke every other session so a stolen refresh token stops working too.
    await this.refreshTokenRepository.revokeAllForUser(userId);
    this.eventEmitter.emit(
      USER_SESSION_REVOKED_EVENT,
      new UserSessionRevokedEvent(userId),
    );

    return {
      message: 'Password changed successfully',
    };
  }
}
