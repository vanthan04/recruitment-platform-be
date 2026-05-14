import { BaseEntity } from '@/common/domain/base.entity';

/**
 * Skill entity — part of CV aggregate.
 * Framework-agnostic — no NestJS or Prisma imports.
 */
export class Skill extends BaseEntity {
  name: string;
  level: string | null;
  cvId: string;

  constructor(partial: Partial<Skill>) {
    super();
    Object.assign(this, partial);
  }
}
