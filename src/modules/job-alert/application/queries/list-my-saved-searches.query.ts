import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { ISavedSearchRepository } from '@/modules/job-alert/domain/repositories/saved-search.repository';
import { SavedSearchResponseMapper } from '@/modules/job-alert/application/mappers/saved-search-response.mapper';
import { SavedSearchResponseDto } from '@/modules/job-alert/application/dto/saved-search-response.dto';

export class ListMySavedSearchesQuery {
  constructor(public readonly userId: string) {}
}

@Injectable()
@QueryHandler(ListMySavedSearchesQuery)
export class ListMySavedSearchesHandler implements IQueryHandler<
  ListMySavedSearchesQuery,
  SavedSearchResponseDto[]
> {
  constructor(private readonly savedSearchRepository: ISavedSearchRepository) {}

  async execute({
    userId,
  }: ListMySavedSearchesQuery): Promise<SavedSearchResponseDto[]> {
    const savedSearches =
      await this.savedSearchRepository.findAllByUserId(userId);
    return SavedSearchResponseMapper.toDtoList(savedSearches);
  }
}
