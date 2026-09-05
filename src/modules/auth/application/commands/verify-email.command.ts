import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IAuthUserRepositoryPort } from '@/modules/auth/application/ports/auth-user-repository.port';
import { IVerificationTokenRepositoryPort } from '@/modules/auth/application/ports/verification-token-repository.port';
import { VerificationTokenType } from '@/common/enums/verification-token-type.enum';
import { VerifyEmailDto } from '@/modules/auth/presentation/dtos/verify-email.dto';
import { UserStatus } from '@/common/enums/user-status.enum';
import { InvalidVerificationCodeException } from '@/modules/auth/domain/exceptions/auth.exceptions';
import { hashToken } from '@/common/utils/token-hash.util';

export class VerifyEmailCommand {
  constructor(public readonly dto: VerifyEmailDto) {}
}

@Injectable()
@CommandHandler(VerifyEmailCommand)
export class VerifyEmailHandler implements ICommandHandler<
  VerifyEmailCommand,
  { message: string }
> {
  constructor(
    private readonly userRepository: IAuthUserRepositoryPort,
    private readonly verificationTokenRepository: IVerificationTokenRepositoryPort,
  ) {}

  async execute({ dto }: VerifyEmailCommand): Promise<{ message: string }> {
    const token = await this.verificationTokenRepository.findValidByHashAndType(
      hashToken(dto.code),
      VerificationTokenType.EMAIL_VERIFICATION,
    );
    if (!token) {
      throw new InvalidVerificationCodeException();
    }

    const user = await this.userRepository.findById(token.userId);
    if (!user) {
      throw new InvalidVerificationCodeException();
    }

    await this.verificationTokenRepository.markUsed(token.id);

    user.status = UserStatus.ACTIVE;
    await this.userRepository.save(user);

    return {
      message: 'Account verified successfully',
    };
  }
}
