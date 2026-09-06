import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CategoryPrismaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.category.findUnique({ where: { id } });
  }

  async findManyByIds(ids: string[]) {
    return this.prisma.category.findMany({ where: { id: { in: ids } } });
  }

  async existsBySlug(slug: string): Promise<boolean> {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      select: { id: true },
    });
    return !!category;
  }

  async findAll() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  /**
   * Queries the `job` table directly at the Prisma layer instead of a
   * cross-module port, to avoid a CategoryModule <-> JobModule import cycle
   * (JobModule already imports CategoryModule) — same rationale as
   * CvPrismaRepository.hasActiveApplicationReference.
   */
  async countReferencingJobs(categoryId: string): Promise<number> {
    return this.prisma.job.count({ where: { categoryId, deletedAt: null } });
  }

  async create(data: Prisma.CategoryCreateInput) {
    return this.prisma.category.create({ data });
  }

  async update(id: string, data: Prisma.CategoryUpdateInput) {
    return this.prisma.category.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.category.delete({ where: { id } });
  }
}
