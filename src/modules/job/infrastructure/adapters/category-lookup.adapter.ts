import { Injectable } from '@nestjs/common';
import {
  ICategoryLookupPort,
  JobCategorySummary,
} from '@/modules/job/application/ports/category-lookup.port';
import { ICategoryRepository } from '@/modules/category/domain/repositories/category.repository';

@Injectable()
export class CategoryLookupAdapter implements ICategoryLookupPort {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async exists(categoryId: string): Promise<boolean> {
    const category = await this.categoryRepository.findById(categoryId);
    return !!category;
  }

  async findManyByIds(ids: string[]): Promise<Map<string, JobCategorySummary>> {
    const uniqueIds = [...new Set(ids)];
    const categories = await Promise.all(
      uniqueIds.map((id) => this.categoryRepository.findById(id)),
    );

    const summaries = new Map<string, JobCategorySummary>();
    categories.forEach((category, index) => {
      if (!category) return;
      summaries.set(uniqueIds[index], {
        id: category.id,
        name: category.name,
        slug: category.slug,
      });
    });
    return summaries;
  }
}
