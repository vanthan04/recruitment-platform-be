import { ICategoryRepository } from '@/modules/category/domain/repositories/category.repository';
import { CategoryResponseDto } from '@/modules/category/application/dto/category-response.dto';
export declare class UpdateCategoryUseCase {
    private readonly categoryRepository;
    constructor(categoryRepository: ICategoryRepository);
    execute(categoryId: string, name: string): Promise<CategoryResponseDto>;
}
