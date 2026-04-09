import { Injectable, NotFoundException } from '@nestjs/common';
import { IAuthUserRepositoryPort } from '../ports/auth-user-repository.port';
import { ForgotPasswordDto } from '@/modules/auth/presentation/dtos/forgot-password.dto';
import { IAuthMailServicePort } from '../ports/auth-mail-service.port';

@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    private readonly userRepository: IAuthUserRepositoryPort,
    private readonly mailService: IAuthMailServicePort,
  ) {}

  async execute(dto: ForgotPasswordDto) {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng với email này');
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
