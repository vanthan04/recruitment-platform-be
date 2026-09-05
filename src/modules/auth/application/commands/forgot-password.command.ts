import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IAuthUserRepositoryPort } from '@/modules/auth/application/ports/auth-user-repository.port';
import { IVerificationTokenRepositoryPort } from '@/modules/auth/application/ports/verification-token-repository.port';
import { VerificationTokenType } from '@/common/enums/verification-token-type.enum';
import { ForgotPasswordDto } from '@/modules/auth/presentation/dtos/forgot-password.dto';
import { IAuthMailServicePort } from '@/modules/auth/application/ports/auth-mail-service.port';
import {
  hashToken,
  generateVerificationCode,
} from '@/common/utils/token-hash.util';

const PASSWORD_RESET_TTL_MS = 15 * 60 * 1000; // 15 minutes — shorter-lived than email verification

export class ForgotPasswordCommand {
  constructor(public readonly dto: ForgotPasswordDto) {}
}

@Injectable()
@CommandHandler(ForgotPasswordCommand)
export class ForgotPasswordHandler implements ICommandHandler<
  ForgotPasswordCommand,
  { message: string }
> {
  private readonly logger = new Logger(ForgotPasswordHandler.name);

  constructor(
    private readonly userRepository: IAuthUserRepositoryPort,
    private readonly mailService: IAuthMailServicePort,
    private readonly verificationTokenRepository: IVerificationTokenRepositoryPort,
  ) {}

  async execute({ dto }: ForgotPasswordCommand): Promise<{ message: string }> {
    // Deliberately identical response whether or not the email is registered
    // — a distinct "not found" error here would let an attacker enumerate
    // registered accounts by watching the response. Only do the real work
    // (and only leak timing/side-effects) when a user actually exists.
    const user = await this.userRepository.findByEmail(dto.email);
    if (user) {
      const resetCode = generateVerificationCode();
      await this.verificationTokenRepository.create(
        user.id,
        VerificationTokenType.PASSWORD_RESET,
        hashToken(resetCode),
        new Date(Date.now() + PASSWORD_RESET_TTL_MS),
      );

      // Caught (not propagated) for two reasons: a mail failure shouldn't
      // fail an already-successful token creation, and — just as
      // importantly here — letting it throw would make this endpoint
      // respond differently for a real user (500) than a nonexistent one
      // (200), reopening exactly the account-enumeration side channel this
      // handler's identical-response design exists to close.
      try {
        await this.mailService.sendEmail({
          to: user.email,
          subject: 'Password recovery request',
          text: `Your password recovery code is: ${resetCode}`,
          html: `<b>Your password recovery code is: ${resetCode}</b>`,
        });
      } catch (err) {
        this.logger.error(
          `Failed to send password recovery email to ${user.email}`,
          err instanceof Error ? err.stack : err,
        );
      }
    }

    return {
      message:
        'If an account with that email exists, a password recovery code has been sent',
    };
  }
}
