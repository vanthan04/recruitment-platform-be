import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ICategoryRepository } from '@/modules/category/domain/repositories/category.repository';
import { EntityNotFoundException } from '@/common/exceptions/domain.exception';

export class DeleteCategoryCommand {
  constructor(public readonly categoryId: string) {}
}

@Injectable()
@CommandHandler(DeleteCategoryCommand)
export class DeleteCategoryHandler implements ICommandHandler<DeleteCategoryCommand, void> {
  constructor(private readonly categoryRepository: ICategoryRepository) {}

  async execute({ categoryId }: DeleteCategoryCommand): Promise<void> {
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) {
      throw new EntityNotFoundException('Category', categoryId);
    }

    await this.categoryRepository.delete(categoryId);
  }
}
