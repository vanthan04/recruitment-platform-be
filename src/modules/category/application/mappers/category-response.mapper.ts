import { Category } from '@/modules/category/domain/entities/category.entity';
import { CategoryResponseDto } from '@/modules/category/application/dto/category-response.dto';

export class CategoryResponseMapper {
  static toDto(category: Category): CategoryResponseDto {
    const dto = new CategoryResponseDto();
    dto.id = category.id;
    dto.name = category.name;
    dto.slug = category.slug;
    dto.createdAt = category.createdAt;
    dto.updatedAt = category.updatedAt;
    return dto;
  }

  static toDtoList(categories: Category[]): CategoryResponseDto[] {
    return categories.map(CategoryResponseMapper.toDto);
  }
}
