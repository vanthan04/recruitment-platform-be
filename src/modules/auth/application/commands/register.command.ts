import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RegisterRequestDto } from '@/modules/auth/presentation/dtos/register-request.dto';
import { IAuthUserRepositoryPort } from '@/modules/auth/application/ports/auth-user-repository.port';
import { IAuthMailServicePort } from '@/modules/auth/application/ports/auth-mail-service.port';
import { IVerificationTokenRepositoryPort } from '@/modules/auth/application/ports/verification-token-repository.port';
import { VerificationTokenType } from '@/common/enums/verification-token-type.enum';
import { UserStatus } from '@/common/enums/user-status.enum';
import { EmailAlreadyRegisteredException } from '@/modules/auth/domain/exceptions/auth.exceptions';
import {
  hashToken,
  generateVerificationCode,
} from '@/common/utils/token-hash.util';
import * as bcrypt from 'bcrypt';

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24h

export class RegisterCommand {
  constructor(public readonly dto: RegisterRequestDto) {}
}

@Injectable()
@CommandHandler(RegisterCommand)
export class RegisterHandler implements ICommandHandler<
  RegisterCommand,
  { email: string }
> {
  private readonly logger = new Logger(RegisterHandler.name);

  constructor(
    private readonly userRepository: IAuthUserRepositoryPort,
    private readonly mailService: IAuthMailServicePort,
    private readonly verificationTokenRepository: IVerificationTokenRepositoryPort,
  ) {}

  async execute({ dto }: RegisterCommand): Promise<{ email: string }> {
    const isExisted = await this.userRepository.existsByEmail(dto.email);
    if (isExisted) {
      throw new EmailAlreadyRegisteredException();
    }

    const salt = await bcrypt.genSalt();
    const hashPassword = await bcrypt.hash(dto.password, salt);

    const newUser = await this.userRepository.save({
      email: dto.email,
      password: hashPassword,
      fullName: dto.fullName,
      role: dto.role,
      status: UserStatus.PENDING,
    });

    const verifyCode = generateVerificationCode();
    await this.verificationTokenRepository.create(
      newUser.id,
      VerificationTokenType.EMAIL_VERIFICATION,
      hashToken(verifyCode),
      new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
    );

    // The account and verification token are already committed at this
    // point — an SMTP failure here is a notification problem, not a reason
    // to report the registration itself as failed (the client would retry
    // a "failed" register, but existsByEmail would now reject it).
    try {
      await this.mailService.sendEmail({
        to: dto.email,
        subject: 'Verify your account',
        text: `Your verification code is: ${verifyCode}`,
        html: `<b>Your verification code is: ${verifyCode}</b>`,
      });
    } catch (err) {
      this.logger.error(
        `Failed to send verification email to ${dto.email}`,
        err instanceof Error ? err.stack : err,
      );
    }

    return {
      email: newUser.email,
    };
  }
}
