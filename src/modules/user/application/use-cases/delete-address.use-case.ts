import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { IAddressRepository } from '@/modules/user/domain/repositories/address.repository';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';

@Injectable()
export class DeleteAddressUseCase {
  constructor(
    private readonly addressRepository: IAddressRepository,
    private readonly userRepository: IUserRepository,
  ) { }

  async execute(userId: string, addressId: string) {
    const user = await this.userRepository.findByIdWithProfile(userId);
    if (!user || !user.profile) {
      throw new NotFoundException('Người dùng hoặc hồ sơ không tồn tại');
    }

    const existingAddress = await this.addressRepository.findById(addressId);
    if (!existingAddress) {
      throw new NotFoundException('Địa chỉ không tồn tại');
    }

    if (existingAddress.profileId !== user.profile.id) {
      throw new ForbiddenException('Bạn không có quyền xóa địa chỉ này');
    }

    if (existingAddress.isDefault) {
      throw new BadRequestException('Không thể xóa địa chỉ mặc định');
    }

    await this.addressRepository.delete(addressId);

    return {
      message: 'Xóa địa chỉ thành công',
    };
  }
}
