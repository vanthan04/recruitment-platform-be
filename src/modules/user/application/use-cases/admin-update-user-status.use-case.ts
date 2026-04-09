import { Injectable, NotFoundException } from '@nestjs/common';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';
import { UserStatus } from '@/common/enums/user-status.enum';
import { UserRole } from '@/common/enums/user-role.enum';

export interface AdminUpdateUserInput {
  status?: UserStatus;
  role?: UserRole;
}

@Injectable()
export class AdminUpdateUserStatusUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: string, input: AdminUpdateUserInput) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    if (input.status) {
      user.status = input.status;
    }
    if (input.role) {
      user.role = input.role;
    }

    await this.userRepository.save(user);

    return {
      message: 'Cập nhật trạng thái người dùng thành công',
    };
  }
}
