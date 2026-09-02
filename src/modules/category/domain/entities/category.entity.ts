import { BaseEntity } from '@/common/domain/base.entity';

/**
 * Category Aggregate Root.
 * Framework-agnostic — no NestJS or Prisma imports.
 */
export class Category extends BaseEntity {
  name: string;
  slug: string;

  constructor(partial: Partial<Category>) {
    super();
    Object.assign(this, partial);
  }

  updateName(name: string): void {
    this.name = name;
  }
}
