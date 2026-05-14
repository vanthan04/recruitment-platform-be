import { BaseEntity } from '@/common/domain/base.entity';

export class Bookmark extends BaseEntity {
  userId: string;
  jobId: string;

  constructor(partial: Partial<Bookmark>) {
    super();
    Object.assign(this, partial);
  }
}
