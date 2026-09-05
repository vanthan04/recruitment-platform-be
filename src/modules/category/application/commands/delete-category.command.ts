import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ICategoryRepository } from '@/modules/category/domain/repositories/category.repository';
import {
  CategoryNotFoundException,
  CategoryInUseException,
} from '@/modules/category/domain/exceptions/category.exceptions';

export class DeleteCategoryCommand {
  constructor(public readonly categoryId: string) {}
}

@Injectable()
@CommandHandler(DeleteCategoryCommand)
export class DeleteCategoryHandler implements ICommandHandler<
  DeleteCategoryCommand,
  void
> {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async execute({ categoryId }: DeleteCategoryCommand): Promise<void> {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw new CategoryNotFoundException(categoryId);
    }

    // Category is hard-deleted (unlike Job/Company/Cv, which soft-delete) and
    // Job.categoryId is ON DELETE SET NULL — without this check, deleting a
    // shared taxonomy entry would silently un-categorize every job using it,
    // with no confirmation and no audit trail.
    const jobCount = await this.categoryRepository.countReferencingJobs(categoryId);
    if (jobCount > 0) {
      throw new CategoryInUseException(jobCount);
    }

    await this.categoryRepository.delete(categoryId);
  }
}
