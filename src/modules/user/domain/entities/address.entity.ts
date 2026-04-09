import { BaseEntity } from '@/common/domain/base.entity';

export class Address extends BaseEntity {
  province: string;
  ward: string;
  hamlet: string;
  address: string;
  isDefault: boolean;
  profileId: string;

  constructor(partial: Partial<Address>) {
    super();
    Object.assign(this, partial);
    this.isDefault = partial.isDefault ?? false;
  }
}
