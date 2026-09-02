import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IAuthUserRepositoryPort } from '@/modules/auth/application/ports/auth-user-repository.port';
import { ForgotPasswordDto } from '@/modules/auth/presentation/dtos/forgot-password.dto';
import { IAuthMailServicePort } from '@/modules/auth/application/ports/auth-mail-service.port';
import { UserNotFoundException } from '@/modules/auth/domain/exceptions/auth.exceptions';

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
  ) {}

  async execute({ dto }: ForgotPasswordCommand): Promise<{ message: string }> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UserNotFoundException(dto.email);
    }

    const resetCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    user.verifyCode = resetCode;

    await this.userRepository.save(user);

    await this.mailService.sendEmail({
      to: user.email,
      subject: 'Yêu cầu khôi phục mật khẩu',
      text: `Mã khôi phục mật khẩu của bạn là: ${resetCode}`,
      html: `<b>Mã khôi phục mật khẩu của bạn là: ${resetCode}</b>`,
    });

    return {
      message: 'Mã khôi phục mật khẩu đã được gửi vào email của bạn',
    };
  }
}
