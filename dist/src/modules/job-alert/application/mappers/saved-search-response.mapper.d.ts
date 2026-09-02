import { SavedSearch } from '@/modules/job-alert/domain/entities/saved-search.entity';
import { SavedSearchResponseDto } from '@/modules/job-alert/application/dto/saved-search-response.dto';
export declare class SavedSearchResponseMapper {
    static toDto(savedSearch: SavedSearch): SavedSearchResponseDto;
    static toDtoList(savedSearches: SavedSearch[]): SavedSearchResponseDto[];
}
