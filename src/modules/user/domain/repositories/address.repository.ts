import { Address } from '@/modules/user/domain/entities/address.entity';

export abstract class IAddressRepository {
  abstract findById(id: string): Promise<Address | null>;
  abstract findByProfileId(profileId: string): Promise<Address[]>;
  abstract create(address: Partial<Address>): Promise<Address>;
  abstract update(id: string, address: Partial<Address>): Promise<Address>;
  abstract delete(id: string): Promise<void>;
  abstract setDefault(id: string, profileId: string): Promise<void>;
}
