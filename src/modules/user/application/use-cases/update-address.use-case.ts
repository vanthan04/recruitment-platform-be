import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IAddressRepository } from '@/modules/user/domain/repositories/address.repository';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';

export interface UpdateAddressInput {
  province?: string;
  ward?: string;
  hamlet?: string;
  address?: string;
  isDefault?: boolean;
}

@Injectable()
export class UpdateAddressUseCase {
  constructor(
    private readonly addressRepository: IAddressRepository,
    private readonly userRepository: IUserRepository,
  ) { }

  async execute(userId: string, addressId: string, input: UpdateAddressInput) {
    const user = await this.userRepository.findByIdWithProfile(userId);
    if (!user || !user.profile) {
      throw new NotFoundException('Người dùng hoặc hồ sơ không tồn tại');
    }

    const existingAddress = await this.addressRepository.findById(addressId);
    if (!existingAddress) {
      throw new NotFoundException('Địa chỉ không tồn tại');
    }

    if (existingAddress.profileId !== user.profile.id) {
      throw new ForbiddenException('Bạn không có quyền cập nhật địa chỉ này');
    }

    if (input.isDefault && !existingAddress.isDefault) {
      await this.addressRepository.setDefault(addressId, user.profile.id);
    }

    const updated = await this.addressRepository.update(addressId, input);
    return updated;
  }
}
