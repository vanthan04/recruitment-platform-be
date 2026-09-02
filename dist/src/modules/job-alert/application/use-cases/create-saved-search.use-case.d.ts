import { ISavedSearchRepository } from '@/modules/job-alert/domain/repositories/saved-search.repository';
import { ICategoryRepository } from '@/modules/category/domain/repositories/category.repository';
import { SavedSearchResponseDto } from '@/modules/job-alert/application/dto/saved-search-response.dto';
export interface CreateSavedSearchInput {
    keyword?: string;
    location?: string;
    categoryId?: string;
    jobType?: string;
}
export declare class CreateSavedSearchUseCase {
    private readonly savedSearchRepository;
    private readonly categoryRepository;
    constructor(savedSearchRepository: ISavedSearchRepository, categoryRepository: ICategoryRepository);
    execute(userId: string, input: CreateSavedSearchInput): Promise<SavedSearchResponseDto>;
}
