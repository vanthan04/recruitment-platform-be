import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler, Query } from '@nestjs/cqrs';
import { ISavedSearchRepository } from '@/modules/job-alert/domain/repositories/saved-search.repository';
import { SavedSearchResponseMapper } from '@/modules/job-alert/application/mappers/saved-search-response.mapper';
import { SavedSearchResponseDto } from '@/modules/job-alert/application/dto/saved-search-response.dto';
import { normalizePagination } from '@/common/utils/pagination.util';

export interface ListMySavedSearchesResult {
  savedSearches: SavedSearchResponseDto[];
  total: number;
  page: number;
  limit: number;
}

export class ListMySavedSearchesQuery extends Query<ListMySavedSearchesResult> {
  constructor(
    public readonly userId: string,
    public readonly page: number = 1,
    public readonly limit: number = 20,
  ) {
    super();
  }
}

@Injectable()
@QueryHandler(ListMySavedSearchesQuery)
export class ListMySavedSearchesHandler implements IQueryHandler<
  ListMySavedSearchesQuery,
  ListMySavedSearchesResult
> {
  constructor(private readonly savedSearchRepository: ISavedSearchRepository) {}

  async execute({
    userId,
    page,
    limit,
  }: ListMySavedSearchesQuery): Promise<ListMySavedSearchesResult> {
    const normalized = normalizePagination({ page, limit });
    const { savedSearches, total } =
      await this.savedSearchRepository.findAllByUserId(userId, {
        skip: normalized.skip,
        take: normalized.limit,
      });

    return {
      savedSearches: SavedSearchResponseMapper.toDtoList(savedSearches),
      total,
      page: normalized.page,
      limit: normalized.limit,
    };
  }
}
