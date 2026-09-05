import { Injectable } from '@nestjs/common';
import { ISkillRepository } from '@/modules/skill/domain/repositories/skill.repository';
import { Skill } from '@/modules/skill/domain/entities/skill.entity';
import { SkillPrismaRepository } from '@/modules/skill/infrastructure/persistence/prisma/skill-prisma.repository';
import { SkillMapper } from '@/modules/skill/infrastructure/persistence/mappers/skill.mapper';

@Injectable()
export class SkillInfraRepository implements ISkillRepository {
  constructor(private readonly skillPrisma: SkillPrismaRepository) {}

  async findById(id: string): Promise<Skill | null> {
    const raw = await this.skillPrisma.findById(id);
    return SkillMapper.toDomain(raw);
  }

  async findManyByIds(ids: string[]): Promise<Skill[]> {
    if (ids.length === 0) return [];
    const raws = await this.skillPrisma.findManyByIds(ids);
    return raws.map((r) => SkillMapper.toDomain(r)!);
  }

  async existsBySlug(slug: string): Promise<boolean> {
    return this.skillPrisma.existsBySlug(slug);
  }

  async findAll(): Promise<Skill[]> {
    const raws = await this.skillPrisma.findAll();
    return raws.map((r) => SkillMapper.toDomain(r)!);
  }

  async save(skill: Skill): Promise<Skill> {
    const data = SkillMapper.toPersistence(skill);
    const raw = await this.skillPrisma.create(data);
    return SkillMapper.toDomain(raw)!;
  }

  async update(skill: Skill): Promise<Skill> {
    const data = SkillMapper.toPersistence(skill);
    const raw = await this.skillPrisma.update(skill.id, data);
    return SkillMapper.toDomain(raw)!;
  }

  async delete(id: string): Promise<void> {
    await this.skillPrisma.delete(id);
  }
}
