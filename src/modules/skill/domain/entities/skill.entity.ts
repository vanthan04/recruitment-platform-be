import { BaseEntity } from '@/common/domain/base.entity';

/**
 * Skill Aggregate Root — a shared, admin-managed taxonomy attached to Jobs.
 * Framework-agnostic — no NestJS or Prisma imports.
 */
export class Skill extends BaseEntity {
  name: string;
  slug: string;

  constructor(partial: Partial<Skill>) {
    super();
    Object.assign(this, partial);
  }

  updateName(name: string): void {
    this.name = name;
  }
}
