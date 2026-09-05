import { Skill } from '@/modules/skill/domain/entities/skill.entity';

/**
 * Skill Repository interface (port).
 * Defined in the domain layer — implementation lives in infrastructure.
 */
export abstract class ISkillRepository {
  abstract findById(id: string): Promise<Skill | null>;
  abstract findManyByIds(ids: string[]): Promise<Skill[]>;
  abstract existsBySlug(slug: string): Promise<boolean>;
  abstract findAll(): Promise<Skill[]>;
  abstract save(skill: Skill): Promise<Skill>;
  abstract update(skill: Skill): Promise<Skill>;
  abstract delete(id: string): Promise<void>;
}
