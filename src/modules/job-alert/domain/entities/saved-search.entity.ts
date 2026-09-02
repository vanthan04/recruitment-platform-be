import { BaseEntity } from '@/common/domain/base.entity';
import { JobType } from '@/modules/job/domain/value-objects/job-type.vo';

export class SavedSearch extends BaseEntity {
  userId: string;
  keyword: string | null;
  location: string | null;
  categoryId: string | null;
  jobType: JobType | null;

  constructor(partial: Partial<SavedSearch>) {
    super();
    Object.assign(this, partial);
    this.keyword = partial.keyword ?? null;
    this.location = partial.location ?? null;
    this.categoryId = partial.categoryId ?? null;
    this.jobType = partial.jobType ?? null;
  }
}
