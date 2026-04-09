import { Address } from '@/modules/user/domain/entities/address.entity';

export class AddressMapper {
  static toDomain(raw: any): Address | null {
    if (!raw) return null;

    return new Address({
      id: raw.id,
      province: raw.province,
      ward: raw.ward,
      hamlet: raw.hamlet,
      address: raw.address,
      isDefault: raw.isDefault,
      profileId: raw.profileId,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}
