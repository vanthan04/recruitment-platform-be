import { ISavedSearchRepository } from '@/modules/job-alert/domain/repositories/saved-search.repository';
export declare class DeleteSavedSearchUseCase {
    private readonly savedSearchRepository;
    constructor(savedSearchRepository: ISavedSearchRepository);
    execute(userId: string, savedSearchId: string): Promise<void>;
}
