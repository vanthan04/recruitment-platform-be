import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IAuthUserRepositoryPort } from '@/modules/auth/application/ports/auth-user-repository.port';
import { IVerificationTokenRepositoryPort } from '@/modules/auth/application/ports/verification-token-repository.port';
import { VerificationTokenType } from '@/common/enums/verification-token-type.enum';
import { ForgotPasswordDto } from '@/modules/auth/presentation/dtos/forgot-password.dto';
import { IAuthMailServicePort } from '@/modules/auth/application/ports/auth-mail-service.port';
import { UserNotFoundException } from '@/modules/auth/domain/exceptions/auth.exceptions';
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
  constructor(
    private readonly userRepository: IAuthUserRepositoryPort,
    private readonly mailService: IAuthMailServicePort,
    private readonly verificationTokenRepository: IVerificationTokenRepositoryPort,
  ) {}

  async execute({ dto }: ForgotPasswordCommand): Promise<{ message: string }> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UserNotFoundException(dto.email);
    }

    const resetCode = generateVerificationCode();
    await this.verificationTokenRepository.create(
      user.id,
      VerificationTokenType.PASSWORD_RESET,
      hashToken(resetCode),
      new Date(Date.now() + PASSWORD_RESET_TTL_MS),
    );

    await this.mailService.sendEmail({
      to: user.email,
      subject: 'Password recovery request',
      text: `Your password recovery code is: ${resetCode}`,
      html: `<b>Your password recovery code is: ${resetCode}</b>`,
    });

    return {
      message: 'A password recovery code has been sent to your email',
    };
  }
}
