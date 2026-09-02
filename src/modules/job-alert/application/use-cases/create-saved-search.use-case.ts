import { Injectable } from '@nestjs/common';
import { ISavedSearchRepository } from '@/modules/job-alert/domain/repositories/saved-search.repository';
import { ICategoryRepository } from '@/modules/category/domain/repositories/category.repository';
import { SavedSearch } from '@/modules/job-alert/domain/entities/saved-search.entity';
import { JobType } from '@/modules/job/domain/value-objects/job-type.vo';
import { EntityNotFoundException } from '@/common/exceptions/domain.exception';
import { SavedSearchResponseMapper } from '@/modules/job-alert/application/mappers/saved-search-response.mapper';
import { SavedSearchResponseDto } from '@/modules/job-alert/application/dto/saved-search-response.dto';

export interface CreateSavedSearchInput {
  keyword?: string;
  location?: string;
  categoryId?: string;
  jobType?: string;
}

@Injectable()
export class CreateSavedSearchUseCase {
  constructor(
    private readonly savedSearchRepository: ISavedSearchRepository,
    private readonly categoryRepository: ICategoryRepository,
  ) {}

  async execute(userId: string, input: CreateSavedSearchInput): Promise<SavedSearchResponseDto> {
    if (input.categoryId && !(await this.categoryRepository.findById(input.categoryId))) {
      throw new EntityNotFoundException('Category', input.categoryId);
    }

    const savedSearch = new SavedSearch({
      userId,
      keyword: input.keyword ?? null,
      location: input.location ?? null,
      categoryId: input.categoryId ?? null,
      jobType: (input.jobType as JobType) ?? null,
    });

    const saved = await this.savedSearchRepository.save(savedSearch);
    return SavedSearchResponseMapper.toDto(saved);
  }
}
