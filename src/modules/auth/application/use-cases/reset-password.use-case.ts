import { Injectable, NotFoundException } from '@nestjs/common';
import { IAuthUserRepositoryPort } from '../ports/auth-user-repository.port';
import { ResetPasswordDto } from '@/modules/auth/presentation/dtos/reset-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ResetPasswordUseCase {
  constructor(private readonly userRepository: IAuthUserRepositoryPort) {}

  async execute(dto: ResetPasswordDto) {
    const user = await this.userRepository.findByVerifyCode(dto.code);
    if (!user) {
      throw new NotFoundException('Mã xác thực không hợp lệ hoặc đã hết hạn');
    }

    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(dto.newPassword, salt);
    user.verifyCode = undefined; // Clear code after successful reset

    await this.userRepository.save(user);

    return {
      message: 'Mật khẩu đã được thay đổi thành công',
    };
  }
}
