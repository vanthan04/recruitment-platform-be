import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ISavedSearchRepository } from '@/modules/job-alert/domain/repositories/saved-search.repository';
import { ICategoryLookupPort } from '@/modules/job-alert/application/ports/category-lookup.port';
import { SavedSearch } from '@/modules/job-alert/domain/entities/saved-search.entity';
import { EmploymentType } from '@/modules/job/domain/value-objects/employment-type.vo';
import { WorkMode } from '@/modules/job/domain/value-objects/work-mode.vo';
import { SavedSearchCategoryNotFoundException } from '@/modules/job-alert/domain/exceptions/job-alert.exceptions';
import { SavedSearchResponseMapper } from '@/modules/job-alert/application/mappers/saved-search-response.mapper';
import { SavedSearchResponseDto } from '@/modules/job-alert/application/dto/saved-search-response.dto';

export interface CreateSavedSearchInput {
  keyword?: string;
  location?: string;
  categoryId?: string;
  employmentType?: string;
  workMode?: string;
}

export class CreateSavedSearchCommand {
  constructor(
    public readonly userId: string,
    public readonly input: CreateSavedSearchInput,
  ) {}
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
