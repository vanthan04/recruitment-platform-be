import { ICategoryRepository } from '@/modules/category/domain/repositories/category.repository';
export declare class DeleteCategoryUseCase {
    private readonly categoryRepository;
    constructor(categoryRepository: ICategoryRepository);
    execute(categoryId: string): Promise<void>;
}
