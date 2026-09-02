import { ISavedSearchRepository } from '@/modules/job-alert/domain/repositories/saved-search.repository';
import { SavedSearchResponseDto } from '@/modules/job-alert/application/dto/saved-search-response.dto';
export declare class ListMySavedSearchesUseCase {
    private readonly savedSearchRepository;
    constructor(savedSearchRepository: ISavedSearchRepository);
    execute(userId: string): Promise<SavedSearchResponseDto[]>;
}
