import { Injectable } from '@nestjs/common';
import { ICategoryLookupPort } from '@/modules/job/application/ports/category-lookup.port';
import { ICategoryRepository } from '@/modules/category/domain/repositories/category.repository';

@Injectable()
export class CategoryLookupAdapter implements ICategoryLookupPort {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async exists(categoryId: string): Promise<boolean> {
    const category = await this.categoryRepository.findById(categoryId);
    return !!category;
  }
}
