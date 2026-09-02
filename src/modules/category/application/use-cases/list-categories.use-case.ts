import { Injectable } from '@nestjs/common';
import { ICategoryRepository } from '@/modules/category/domain/repositories/category.repository';
import { CategoryResponseMapper } from '@/modules/category/application/mappers/category-response.mapper';
import { CategoryResponseDto } from '@/modules/category/application/dto/category-response.dto';

@Injectable()
export class ListCategoriesUseCase {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async execute(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryRepository.findAll();
    return CategoryResponseMapper.toDtoList(categories);
  }
}
