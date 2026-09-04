import { Skill } from '@/modules/skill/domain/entities/skill.entity';

export class SkillMapper {
  static toDomain(raw: any): Skill | null {
    if (!raw) return null;

    return new Skill({
      id: raw.id,
      name: raw.name,
      slug: raw.slug,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPersistence(skill: Skill): any {
    return {
      name: skill.name,
      slug: skill.slug,
    };
  }
}
