import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ISavedSearchRepository } from '@/modules/job-alert/domain/repositories/saved-search.repository';
import { EntityNotFoundException, UnauthorizedDomainException } from '@/common/exceptions/domain.exception';

export class DeleteSavedSearchCommand {
  constructor(
    public readonly userId: string,
    public readonly savedSearchId: string,
  ) {}
}

@Injectable()
@CommandHandler(DeleteSavedSearchCommand)
export class DeleteSavedSearchHandler implements ICommandHandler<DeleteSavedSearchCommand, void> {
  constructor(private readonly savedSearchRepository: ISavedSearchRepository) {}

  async execute({ userId, savedSearchId }: DeleteSavedSearchCommand): Promise<void> {
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
