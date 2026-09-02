import { Injectable } from '@nestjs/common';
import { ICategoryRepository } from '@/modules/category/domain/repositories/category.repository';
import { EntityNotFoundException } from '@/common/exceptions/domain.exception';
import { CategoryResponseMapper } from '@/modules/category/application/mappers/category-response.mapper';
import { CategoryResponseDto } from '@/modules/category/application/dto/category-response.dto';

@Injectable()
export class UpdateCategoryUseCase {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async execute(categoryId: string, name: string): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw new EntityNotFoundException('Category', categoryId);
    }

    category.updateName(name);

    const updated = await this.categoryRepository.update(category);
    return CategoryResponseMapper.toDto(updated);
  }
}
