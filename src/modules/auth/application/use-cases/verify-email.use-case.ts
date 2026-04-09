import { Injectable, NotFoundException } from '@nestjs/common';
import { IAuthUserRepositoryPort } from '../ports/auth-user-repository.port';
import { VerifyEmailDto } from '@/modules/auth/presentation/dtos/verify-email.dto';
import { UserStatus } from '@/common/enums/user-status.enum';

@Injectable()
export class VerifyEmailUseCase {
  constructor(private readonly userRepository: IAuthUserRepositoryPort) {}

  async execute(dto: VerifyEmailDto) {
    const user = await this.userRepository.findByVerifyCode(dto.code);
    if (!user) {
      throw new NotFoundException('Mã xác thực không hợp lệ hoặc đã hết hạn');
    }

    user.status = UserStatus.ACTIVE;
    user.verifyCode = undefined; // Clear code after successful verification

    await this.userRepository.save(user);

    return {
      message: 'Xác thực tài khoản thành công',
    };
  }
}
