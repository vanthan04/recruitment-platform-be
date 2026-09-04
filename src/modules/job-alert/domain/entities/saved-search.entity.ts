import { BaseEntity } from '@/common/domain/base.entity';
import { EmploymentType } from '@/modules/job/domain/value-objects/employment-type.vo';
import { WorkMode } from '@/modules/job/domain/value-objects/work-mode.vo';

export class SavedSearch extends BaseEntity {
  userId: string;
  keyword: string | null;
  location: string | null;
  categoryId: string | null;
  employmentType: EmploymentType | null;
  workMode: WorkMode | null;

  constructor(partial: Partial<SavedSearch>) {
    super();
    Object.assign(this, partial);
    this.keyword = partial.keyword ?? null;
    this.location = partial.location ?? null;
    this.categoryId = partial.categoryId ?? null;
    this.employmentType = partial.employmentType ?? null;
    this.workMode = partial.workMode ?? null;
  }
}
