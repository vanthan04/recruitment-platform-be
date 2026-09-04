import { SavedSearch } from '@/modules/job-alert/domain/entities/saved-search.entity';
import { SavedSearchResponseDto } from '@/modules/job-alert/application/dto/saved-search-response.dto';

export class SavedSearchResponseMapper {
  static toDto(savedSearch: SavedSearch): SavedSearchResponseDto {
    const dto = new SavedSearchResponseDto();
    dto.id = savedSearch.id;
    dto.keyword = savedSearch.keyword;
    dto.location = savedSearch.location;
    dto.categoryId = savedSearch.categoryId;
    dto.employmentType = savedSearch.employmentType;
    dto.workMode = savedSearch.workMode;
    dto.createdAt = savedSearch.createdAt;
    return dto;
  }

  static toDtoList(savedSearches: SavedSearch[]): SavedSearchResponseDto[] {
    return savedSearches.map(SavedSearchResponseMapper.toDto);
  }
}
