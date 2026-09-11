import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { Category as PrismaCategory, Prisma } from '@prisma/client';
import { ICategoryRepository } from '@/modules/category/domain/repositories/category.repository';
import { Category } from '@/modules/category/domain/entities/category.entity';

/**
 * Single Prisma-backed implementation of ICategoryRepository. A "name+slug"
 * lookup table has no swappable-persistence requirement and no second
 * implementation to justify a separate infra-repository/prisma-repository
 * split — see MICROSERVICES_MIGRATION_PLAN.md discussion / the fullstack
 * review for why this collapses what used to be three layers (infra
 * repository -> prisma repository -> mapper) into one.
 */
@Injectable()
export class CategoryPrismaRepository implements ICategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Category | null> {
    const raw = await this.prisma.category.findUnique({ where: { id } });
    return toDomain(raw);
  }

  async findManyByIds(ids: string[]): Promise<Category[]> {
    if (ids.length === 0) return [];
    const raws = await this.prisma.category.findMany({
      where: { id: { in: ids } },
    });
    return raws.map((r) => toDomain(r)!);
  }

  async existsBySlug(slug: string): Promise<boolean> {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      select: { id: true },
    });
    return !!category;
  }

  async findAll(): Promise<Category[]> {
    const raws = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    return raws.map((r) => toDomain(r)!);
  }

  /**
   * Queries the `job` table directly instead of a cross-module port, to
   * avoid a CategoryModule <-> JobModule import cycle (JobModule already
   * imports CategoryModule) — same rationale as
   * CvPrismaRepository.hasActiveApplicationReference.
   */
  async countReferencingJobs(categoryId: string): Promise<number> {
    return this.prisma.job.count({ where: { categoryId, deletedAt: null } });
  }

  async save(category: Category): Promise<Category> {
    const raw = await this.prisma.category.create({
      data: toPersistence(category),
    });
    return toDomain(raw)!;
  }

  async update(category: Category): Promise<Category> {
    const raw = await this.prisma.category.update({
      where: { id: category.id },
      data: toPersistence(category),
    });
    return toDomain(raw)!;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.category.delete({ where: { id } });
  }
}

function toDomain(raw: PrismaCategory | null): Category | null {
  if (!raw) return null;
  return new Category({
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  });
}

function toPersistence(category: Category): Prisma.CategoryCreateInput {
  return {
    name: category.name,
    slug: category.slug,
  };
}
