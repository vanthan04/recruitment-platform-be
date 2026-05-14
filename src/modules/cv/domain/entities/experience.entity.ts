import { BaseEntity } from '@/common/domain/base.entity';
import { DateRange } from '@/modules/cv/domain/value-objects/date-range.vo';

/**
 * Experience entity — part of CV aggregate.
 * Framework-agnostic — no NestJS or Prisma imports.
 */
export class Experience extends BaseEntity {
  company: string;
  position: string;
  description: string | null;
  dateRange: DateRange;
  cvId: string;

  constructor(partial: Partial<Experience>) {
    super();
    Object.assign(this, partial);
  }

  get isCurrent(): boolean {
    return this.dateRange?.isCurrent ?? false;
  }
}
