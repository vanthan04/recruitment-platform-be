import { CreateSavedSearchUseCase } from '@/modules/job-alert/application/use-cases/create-saved-search.use-case';
import { ListMySavedSearchesUseCase } from '@/modules/job-alert/application/use-cases/list-my-saved-searches.use-case';
import { DeleteSavedSearchUseCase } from '@/modules/job-alert/application/use-cases/delete-saved-search.use-case';
import { CreateSavedSearchDto } from '@/modules/job-alert/presentation/dtos/create-saved-search.dto';
export declare class SavedSearchController {
    private readonly createSavedSearchUseCase;
    private readonly listMySavedSearchesUseCase;
    private readonly deleteSavedSearchUseCase;
    constructor(createSavedSearchUseCase: CreateSavedSearchUseCase, listMySavedSearchesUseCase: ListMySavedSearchesUseCase, deleteSavedSearchUseCase: DeleteSavedSearchUseCase);
    create(userId: string, dto: CreateSavedSearchDto): Promise<import("../../../../common/dtos/response.dto").ResponseDto<import("../../application/dto/saved-search-response.dto").SavedSearchResponseDto>>;
    list(userId: string): Promise<import("../../../../common/dtos/response.dto").ResponseDto<import("../../application/dto/saved-search-response.dto").SavedSearchResponseDto>>;
    delete(userId: string, savedSearchId: string): Promise<void>;
}
