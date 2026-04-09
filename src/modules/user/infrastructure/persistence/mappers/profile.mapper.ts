import { Profile } from '@/modules/user/domain/entities/profile.entity';
import { Gender } from '@/common/enums/gender.enum';
import { AddressMapper } from './address.mapper';

export class ProfileMapper {
  static toDomain(raw: any): Profile | null {
    if (!raw) return null;

    return new Profile({
      id: raw.id,
      fullName: raw.fullName,
      birthDate: raw.birthDate,
      gender: raw.gender as Gender,
      phoneNumber: raw.phoneNumber,
      avatarUrl: raw.avatarUrl,
      loyaltyPoints: raw.loyaltyPoints,
      wishList: raw.wishList as string[],
      userId: raw.userId,
      addresses: raw.addresses ? raw.addresses.map((addr: any) => AddressMapper.toDomain(addr)!) : undefined,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}
