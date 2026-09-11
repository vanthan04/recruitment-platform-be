import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler, Command } from '@nestjs/cqrs';
import { ISavedSearchRepository } from '@/modules/job-alert/domain/repositories/saved-search.repository';
import { ICategoryLookupPort } from '@/modules/job-alert/application/ports/category-lookup.port';
import { SavedSearch } from '@/modules/job-alert/domain/entities/saved-search.entity';
import { EmploymentType } from '@/modules/job/domain/value-objects/employment-type.vo';
import { WorkMode } from '@/modules/job/domain/value-objects/work-mode.vo';
import {
  SavedSearchCategoryNotFoundException,
  TooManySavedSearchesException,
} from '@/modules/job-alert/domain/exceptions/job-alert.exceptions';
import { SavedSearchResponseMapper } from '@/modules/job-alert/application/mappers/saved-search-response.mapper';
import { SavedSearchResponseDto } from '@/modules/job-alert/application/dto/saved-search-response.dto';

// Each saved search is picked up by the daily digest cron, which runs a
// full job query + email send per search — nothing stopped a single
// account from creating an unbounded number of them (accidentally, via a
// buggy retry loop, or deliberately).
const MAX_SAVED_SEARCHES_PER_USER = 20;

export interface CreateSavedSearchInput {
  keyword?: string;
  location?: string;
  categoryId?: string;
  employmentType?: string;
  workMode?: string;
}

export class CreateSavedSearchCommand extends Command<SavedSearchResponseDto> {
  constructor(
    public readonly userId: string,
    public readonly input: CreateSavedSearchInput,
  ) {
    super();
  }
}

@Injectable()
@CommandHandler(CreateSavedSearchCommand)
export class CreateSavedSearchHandler implements ICommandHandler<
  CreateSavedSearchCommand,
  SavedSearchResponseDto
> {
  constructor(
    private readonly savedSearchRepository: ISavedSearchRepository,
    private readonly categoryLookupPort: ICategoryLookupPort,
  ) {}

  async execute({
    userId,
    input,
  }: CreateSavedSearchCommand): Promise<SavedSearchResponseDto> {
    const existingCount =
      await this.savedSearchRepository.countByUserId(userId);
    if (existingCount >= MAX_SAVED_SEARCHES_PER_USER) {
      throw new TooManySavedSearchesException(MAX_SAVED_SEARCHES_PER_USER);
    }

    if (
      input.categoryId &&
      !(await this.categoryLookupPort.exists(input.categoryId))
    ) {
      throw new SavedSearchCategoryNotFoundException(input.categoryId);
    }

    const savedSearch = new SavedSearch({
      userId,
      keyword: input.keyword ?? null,
      location: input.location ?? null,
      categoryId: input.categoryId ?? null,
      employmentType: (input.employmentType as EmploymentType) ?? null,
      workMode: (input.workMode as WorkMode) ?? null,
    });

    const saved = await this.savedSearchRepository.save(savedSearch);
    return SavedSearchResponseMapper.toDto(saved);
  }
}
