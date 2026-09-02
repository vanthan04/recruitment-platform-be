import { Injectable } from '@nestjs/common';
import { ICategoryRepository } from '@/modules/category/domain/repositories/category.repository';
import { EntityNotFoundException } from '@/common/exceptions/domain.exception';

@Injectable()
export class DeleteCategoryUseCase {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async execute(categoryId: string): Promise<void> {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw new EntityNotFoundException('Category', categoryId);
    }

    await this.categoryRepository.delete(categoryId);
  }
}
