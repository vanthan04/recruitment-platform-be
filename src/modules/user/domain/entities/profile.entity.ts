import { BaseEntity } from '@/common/domain/base.entity';
import { Gender } from '@/common/enums/gender.enum';
import { Address } from '@/modules/user/domain/entities/address.entity';

export class Profile extends BaseEntity {
  fullName: string;
  birthDate?: Date;
  gender?: Gender;
  phoneNumber?: string;
  avatarUrl?: string;
  loyaltyPoints: number;
  wishList: string[]; // Stored as Json in Prisma, but mapped to string array of IDs or similar
  userId: string;
  addresses?: Address[];

  constructor(partial: Partial<Profile>) {
    super();
    Object.assign(this, partial);
    this.loyaltyPoints = partial.loyaltyPoints ?? 0;
    this.wishList = partial.wishList ?? [];
  }
}
