import { Category } from '@/modules/category/domain/entities/category.entity';
import { CategoryResponseDto } from '@/modules/category/application/dto/category-response.dto';
export declare class CategoryResponseMapper {
    static toDto(category: Category): CategoryResponseDto;
    static toDtoList(categories: Category[]): CategoryResponseDto[];
}
