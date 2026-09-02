import { CreateCategoryUseCase } from '@/modules/category/application/use-cases/create-category.use-case';
import { UpdateCategoryUseCase } from '@/modules/category/application/use-cases/update-category.use-case';
import { ListCategoriesUseCase } from '@/modules/category/application/use-cases/list-categories.use-case';
import { DeleteCategoryUseCase } from '@/modules/category/application/use-cases/delete-category.use-case';
import { CreateCategoryDto } from '@/modules/category/presentation/dtos/create-category.dto';
import { UpdateCategoryDto } from '@/modules/category/presentation/dtos/update-category.dto';
export declare class CategoryController {
    private readonly createCategoryUseCase;
    private readonly updateCategoryUseCase;
    private readonly listCategoriesUseCase;
    private readonly deleteCategoryUseCase;
    constructor(createCategoryUseCase: CreateCategoryUseCase, updateCategoryUseCase: UpdateCategoryUseCase, listCategoriesUseCase: ListCategoriesUseCase, deleteCategoryUseCase: DeleteCategoryUseCase);
    create(dto: CreateCategoryDto): Promise<import("../../../../common/dtos/response.dto").ResponseDto<import("../../application/dto/category-response.dto").CategoryResponseDto>>;
    list(): Promise<import("../../../../common/dtos/response.dto").ResponseDto<import("../../application/dto/category-response.dto").CategoryResponseDto>>;
    update(categoryId: string, dto: UpdateCategoryDto): Promise<import("../../../../common/dtos/response.dto").ResponseDto<import("../../application/dto/category-response.dto").CategoryResponseDto>>;
    delete(categoryId: string): Promise<void>;
}
