import { ICategoryRepository } from '@/modules/category/domain/repositories/category.repository';
import { CategoryResponseDto } from '@/modules/category/application/dto/category-response.dto';
export interface CreateCategoryInput {
    name: string;
}
export declare class CreateCategoryUseCase {
    private readonly categoryRepository;
    constructor(categoryRepository: ICategoryRepository);
    execute(input: CreateCategoryInput): Promise<CategoryResponseDto>;
    private generateUniqueSlug;
}
