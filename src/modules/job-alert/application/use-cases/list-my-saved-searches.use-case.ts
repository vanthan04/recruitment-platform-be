import { Injectable } from '@nestjs/common';
import { ISavedSearchRepository } from '@/modules/job-alert/domain/repositories/saved-search.repository';
import { SavedSearchResponseMapper } from '@/modules/job-alert/application/mappers/saved-search-response.mapper';
import { SavedSearchResponseDto } from '@/modules/job-alert/application/dto/saved-search-response.dto';

@Injectable()
export class ListMySavedSearchesUseCase {
  constructor(private readonly savedSearchRepository: ISavedSearchRepository) {}

  async execute(userId: string): Promise<SavedSearchResponseDto[]> {
    const savedSearches = await this.savedSearchRepository.findAllByUserId(userId);
    return SavedSearchResponseMapper.toDtoList(savedSearches);
  }
}
