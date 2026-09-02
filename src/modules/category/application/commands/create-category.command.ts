import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ICategoryRepository } from '@/modules/category/domain/repositories/category.repository';
import { Category } from '@/modules/category/domain/entities/category.entity';
import { CategoryResponseMapper } from '@/modules/category/application/mappers/category-response.mapper';
import { CategoryResponseDto } from '@/modules/category/application/dto/category-response.dto';

export class CreateCategoryCommand {
  constructor(public readonly name: string) {}
}

@Injectable()
@CommandHandler(CreateCategoryCommand)
export class CreateCategoryHandler implements ICommandHandler<
  CreateCategoryCommand,
  CategoryResponseDto
> {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async execute({ name }: CreateCategoryCommand): Promise<CategoryResponseDto> {
    const slug = await this.generateUniqueSlug(name);

    const category = new Category({ name, slug });
    const saved = await this.categoryRepository.save(category);

    return CategoryResponseMapper.toDto(saved);
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let slug = base;
    let suffix = 1;
    while (await this.categoryRepository.existsBySlug(slug)) {
      slug = `${base}-${++suffix}`;
    }
    return slug;
  }
}
