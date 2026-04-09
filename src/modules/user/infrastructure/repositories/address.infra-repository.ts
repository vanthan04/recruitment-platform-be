import { Injectable } from '@nestjs/common';
import { IAddressRepository } from '@/modules/user/domain/repositories/address.repository';
import { Address } from '@/modules/user/domain/entities/address.entity';
import { AddressPrismaRepository } from '@/modules/user/infrastructure/persistence/prisma/address-prisma.repository';
import { AddressMapper } from '@/modules/user/infrastructure/persistence/mappers/address.mapper';
import { PrismaService } from '@/modules/prisma/prisma.service';

@Injectable()
export class AddressInfraRepository implements IAddressRepository {
  constructor(
    private readonly addressRepo: AddressPrismaRepository,
    private readonly prisma: PrismaService,
  ) { }

  async findById(id: string): Promise<Address | null> {
    const raw = await this.addressRepo.findUnique({ where: { id } });
    return AddressMapper.toDomain(raw);
  }

  async findByProfileId(profileId: string): Promise<Address[]> {
    const raws = await this.addressRepo.findMany({ where: { profileId } });
    return raws.map(raw => AddressMapper.toDomain(raw)!);
  }

  async create(address: Partial<Address>): Promise<Address> {
    const raw = await this.addressRepo.create({
      data: {
        province: address.province!,
        ward: address.ward!,
        hamlet: address.hamlet!,
        address: address.address!,
        isDefault: address.isDefault ?? false,
        profile: { connect: { id: address.profileId } }
      }
    });
    return AddressMapper.toDomain(raw)!;
  }

  async update(id: string, address: Partial<Address>): Promise<Address> {
    const raw = await this.addressRepo.update({
      where: { id },
      data: {
        province: address.province,
        ward: address.ward,
        hamlet: address.hamlet,
        address: address.address,
        isDefault: address.isDefault,
      }
    });
    return AddressMapper.toDomain(raw)!;
  }

  async delete(id: string): Promise<void> {
    await this.addressRepo.delete({ where: { id } });
  }

  async setDefault(id: string, profileId: string): Promise<void> {
    // Transaction to unset existing default and set new default
    await this.prisma.$transaction([
      this.prisma.address.updateMany({
        where: { profileId, isDefault: true },
        data: { isDefault: false },
      }),
      this.prisma.address.update({
        where: { id },
        data: { isDefault: true },
      }),
    ]);
  }
}
