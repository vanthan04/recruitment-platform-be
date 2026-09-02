import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ICategoryRepository } from '@/modules/category/domain/repositories/category.repository';
import { CategoryNotFoundException } from '@/modules/category/domain/exceptions/category.exceptions';

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

    await this.categoryRepository.delete(categoryId);
  }
}
