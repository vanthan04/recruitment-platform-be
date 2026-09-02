import { Injectable } from '@nestjs/common';
import { ISavedSearchRepository } from '@/modules/job-alert/domain/repositories/saved-search.repository';
import { EntityNotFoundException, UnauthorizedDomainException } from '@/common/exceptions/domain.exception';

@Injectable()
export class DeleteSavedSearchUseCase {
  constructor(private readonly savedSearchRepository: ISavedSearchRepository) {}

  async execute(userId: string, savedSearchId: string): Promise<void> {
    const savedSearch = await this.savedSearchRepository.findById(savedSearchId);
    if (!savedSearch) {
      throw new EntityNotFoundException('SavedSearch', savedSearchId);
    }

    if (savedSearch.userId !== userId) {
      throw new UnauthorizedDomainException('You are not the owner of this saved search');
    }

    await this.savedSearchRepository.delete(savedSearchId);
  }
}
