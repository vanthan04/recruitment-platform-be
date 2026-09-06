import { Skill } from '@/modules/skill/domain/entities/skill.entity';
import { Skill as PrismaSkill, Prisma } from '@prisma/client';

export class SkillMapper {
  static toDomain(raw: PrismaSkill | null): Skill | null {
    if (!raw) return null;

    return new Skill({
      id: raw.id,
      name: raw.name,
      slug: raw.slug,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPersistence(skill: Skill): Prisma.SkillCreateInput {
    return {
      name: skill.name,
      slug: skill.slug,
    };
  }
}
