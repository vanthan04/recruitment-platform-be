import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IAuthUserRepositoryPort } from '@/modules/auth/application/ports/auth-user-repository.port';
import { IVerificationTokenRepositoryPort } from '@/modules/auth/application/ports/verification-token-repository.port';
import { VerificationTokenType } from '@/common/enums/verification-token-type.enum';
import { ResetPasswordDto } from '@/modules/auth/presentation/dtos/reset-password.dto';
import { InvalidVerificationCodeException } from '@/modules/auth/domain/exceptions/auth.exceptions';
import { hashToken } from '@/common/utils/token-hash.util';
import * as bcrypt from 'bcrypt';

export class ResetPasswordCommand {
  constructor(public readonly dto: ResetPasswordDto) {}
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

    return {
      message: 'Password has been changed successfully',
    };
  }
}
