import { Injectable, NotFoundException } from '@nestjs/common';
import { IAddressRepository } from '@/modules/user/domain/repositories/address.repository';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';

export interface AddAddressInput {
  province: string;
  ward: string;
  hamlet: string;
  address: string;
  isDefault?: boolean;
}

@Injectable()
export class AddAddressUseCase {
  constructor(
    private readonly addressRepository: IAddressRepository,
    private readonly userRepository: IUserRepository,
  ) { }

  async execute(userId: string, input: AddAddressInput) {
    const user = await this.userRepository.findByIdWithProfile(userId);
    if (!user || !user.profile) {
      throw new NotFoundException('Người dùng hoặc hồ sơ không tồn tại');
    }

    // If this is the first address, set it as default
    const existingAddresses = await this.addressRepository.findByProfileId(user.profile.id);
    const isDefault = existingAddresses.length === 0 ? true : (input.isDefault ?? false);

    if (isDefault) {
      await this.addressRepository.setDefault('', user.profile.id); // Reset others
    }

    const newAddress = await this.addressRepository.create({
      ...input,
      isDefault,
      profileId: user.profile.id,
    });

    return newAddress;
  }
}
