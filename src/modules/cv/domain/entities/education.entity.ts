import { BaseEntity } from '@/common/domain/base.entity';
import { DateRange } from '@/modules/cv/domain/value-objects/date-range.vo';

/**
 * Education entity — part of CV aggregate.
 * Framework-agnostic — no NestJS or Prisma imports.
 */
export class Education extends BaseEntity {
  school: string;
  degree: string;
  fieldOfStudy: string | null;
  description: string | null;
  dateRange: DateRange;
  cvId: string;

  constructor(partial: Partial<Education>) {
    super();
    Object.assign(this, partial);
  }
}
