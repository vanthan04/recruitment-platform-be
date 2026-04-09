import { Injectable, NotFoundException } from '@nestjs/common';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';
import { Gender } from '@/common/enums/gender.enum';

export interface UpdateProfileInput {
  fullName?: string;
  phoneNumber?: string;
  gender?: Gender;
  birthDate?: Date;
  avatarUrl?: string;
}

@Injectable()
export class UpdateProfileUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: string, input: UpdateProfileInput) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    await this.userRepository.updateProfile(userId, input);

    return {
      message: 'Cập nhật thông tin cá nhân thành công',
    };
  }
}
