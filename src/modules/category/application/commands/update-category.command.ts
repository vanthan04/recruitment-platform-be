import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ICategoryRepository } from '@/modules/category/domain/repositories/category.repository';
import { CategoryNotFoundException } from '@/modules/category/domain/exceptions/category.exceptions';
import { CategoryResponseMapper } from '@/modules/category/application/mappers/category-response.mapper';
import { CategoryResponseDto } from '@/modules/category/application/dto/category-response.dto';

export class UpdateCategoryCommand {
  constructor(
    public readonly categoryId: string,
    public readonly name: string,
  ) {}
}

@Injectable()
@CommandHandler(UpdateCategoryCommand)
export class UpdateCategoryHandler implements ICommandHandler<
  UpdateCategoryCommand,
  CategoryResponseDto
> {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async execute({
    categoryId,
    name,
  }: UpdateCategoryCommand): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw new CategoryNotFoundException(categoryId);
    }

    category.updateName(name);

    const updated = await this.categoryRepository.update(category);
    return CategoryResponseMapper.toDto(updated);
  }
}
