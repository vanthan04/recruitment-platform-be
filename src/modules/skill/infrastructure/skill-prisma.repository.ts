import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { Skill as PrismaSkill, Prisma } from '@prisma/client';
import { ISkillRepository } from '@/modules/skill/domain/repositories/skill.repository';
import { Skill } from '@/modules/skill/domain/entities/skill.entity';

/**
 * Single Prisma-backed implementation of ISkillRepository — same
 * simplification as CategoryPrismaRepository: a "name+slug" lookup table
 * has no swappable-persistence requirement to justify a separate
 * infra-repository/prisma-repository/mapper split.
 */
@Injectable()
export class SkillPrismaRepository implements ISkillRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Skill | null> {
    const raw = await this.prisma.skill.findUnique({ where: { id } });
    return toDomain(raw);
  }

  async findManyByIds(ids: string[]): Promise<Skill[]> {
    if (ids.length === 0) return [];
    const raws = await this.prisma.skill.findMany({
      where: { id: { in: ids } },
    });
    return raws.map((r) => toDomain(r)!);
  }

  async existsBySlug(slug: string): Promise<boolean> {
    const skill = await this.prisma.skill.findUnique({
      where: { slug },
      select: { id: true },
    });
    return !!skill;
  }

  async findAll(): Promise<Skill[]> {
    const raws = await this.prisma.skill.findMany({
      orderBy: { name: 'asc' },
    });
    return raws.map((r) => toDomain(r)!);
  }

  /**
   * Queries the `jobSkill`/`job` tables directly instead of a cross-module
   * port, to avoid a SkillModule <-> JobModule import cycle (JobModule
   * already imports SkillModule) — same rationale as
   * CvPrismaRepository.hasActiveApplicationReference.
   */
  async countReferencingJobs(skillId: string): Promise<number> {
    return this.prisma.jobSkill.count({
      where: { skillId, job: { deletedAt: null } },
    });
  }

  async save(skill: Skill): Promise<Skill> {
    const raw = await this.prisma.skill.create({
      data: toPersistence(skill),
    });
    return toDomain(raw)!;
  }

  async update(skill: Skill): Promise<Skill> {
    const raw = await this.prisma.skill.update({
      where: { id: skill.id },
      data: toPersistence(skill),
    });
    return toDomain(raw)!;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.skill.delete({ where: { id } });
  }
}

function toDomain(raw: PrismaSkill | null): Skill | null {
  if (!raw) return null;
  return new Skill({
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  });
}

function toPersistence(skill: Skill): Prisma.SkillCreateInput {
  return {
    name: skill.name,
    slug: skill.slug,
  };
}
