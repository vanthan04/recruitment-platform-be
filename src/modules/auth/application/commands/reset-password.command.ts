import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IAuthUserRepositoryPort } from '@/modules/auth/application/ports/auth-user-repository.port';
import { ResetPasswordDto } from '@/modules/auth/presentation/dtos/reset-password.dto';
import { InvalidVerificationCodeException } from '@/modules/auth/domain/exceptions/auth.exceptions';
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
  constructor(private readonly userRepository: IAuthUserRepositoryPort) {}

  async execute({ dto }: ResetPasswordCommand): Promise<{ message: string }> {
    const user = await this.userRepository.findByVerifyCode(dto.code);
    if (!user) {
      throw new InvalidVerificationCodeException();
    }

    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(dto.newPassword, salt);
    user.verifyCode = undefined;

    await this.userRepository.save(user);

    return {
      message: 'Password has been changed successfully',
    };
  }
}
