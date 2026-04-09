import { Injectable, NotFoundException } from '@nestjs/common';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';

@Injectable()
export class GetMyProfileUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: string) {
    const user = await this.userRepository.findByIdWithProfile(userId);
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    // Usually you don't return the password or other sensitive data
    const { password, refreshToken, verifyCode, ...safeUser } = user as any;
    return safeUser;
  }
}
