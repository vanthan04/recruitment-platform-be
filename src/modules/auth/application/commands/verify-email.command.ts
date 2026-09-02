import { Injectable, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IAuthUserRepositoryPort } from '@/modules/auth/application/ports/auth-user-repository.port';
import { VerifyEmailDto } from '@/modules/auth/presentation/dtos/verify-email.dto';
import { UserStatus } from '@/common/enums/user-status.enum';

export class VerifyEmailCommand {
  constructor(public readonly dto: VerifyEmailDto) {}
}

@Injectable()
@CommandHandler(VerifyEmailCommand)
export class VerifyEmailHandler implements ICommandHandler<VerifyEmailCommand, { message: string }> {
  constructor(private readonly userRepository: IAuthUserRepositoryPort) {}

  async execute({ dto }: VerifyEmailCommand): Promise<{ message: string }> {
    const user = await this.userRepository.findByVerifyCode(dto.code);
    if (!user) {
      throw new NotFoundException('Mã xác thực không hợp lệ hoặc đã hết hạn');
    }

    user.status = UserStatus.ACTIVE;
    user.verifyCode = undefined;

    await this.userRepository.save(user);

    return {
      message: 'Xác thực tài khoản thành công',
    };
  }
}
