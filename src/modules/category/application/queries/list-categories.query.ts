import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { ICategoryRepository } from '@/modules/category/domain/repositories/category.repository';
import { CategoryResponseMapper } from '@/modules/category/application/mappers/category-response.mapper';
import { CategoryResponseDto } from '@/modules/category/application/dto/category-response.dto';

export class ListCategoriesQuery {}

@Injectable()
@QueryHandler(ListCategoriesQuery)
export class ListCategoriesHandler implements IQueryHandler<ListCategoriesQuery, CategoryResponseDto[]> {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async execute(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryRepository.findAll();
    return CategoryResponseMapper.toDtoList(categories);
  }
}
