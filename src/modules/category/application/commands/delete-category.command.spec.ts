import {
  DeleteCategoryCommand,
  DeleteCategoryHandler,
} from '@/modules/category/application/commands/delete-category.command';
import { ICategoryRepository } from '@/modules/category/domain/repositories/category.repository';
import {
  CategoryNotFoundException,
  CategoryInUseException,
} from '@/modules/category/domain/exceptions/category.exceptions';
import { Category } from '@/modules/category/domain/entities/category.entity';

describe('DeleteCategoryHandler', () => {
  let handler: DeleteCategoryHandler;
  let categoryRepository: jest.Mocked<ICategoryRepository>;

  beforeEach(() => {
    categoryRepository = {
      findById: jest.fn(),
      findManyByIds: jest.fn(),
      existsBySlug: jest.fn(),
      findAll: jest.fn(),
      countReferencingJobs: jest.fn().mockResolvedValue(0),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    handler = new DeleteCategoryHandler(categoryRepository);
  });

  it('throws CategoryNotFoundException when the category does not exist', async () => {
    categoryRepository.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new DeleteCategoryCommand('cat-1')),
    ).rejects.toThrow(CategoryNotFoundException);
    expect(categoryRepository.delete).not.toHaveBeenCalled();
  });

  it('deletes the category when it exists and no job references it', async () => {
    categoryRepository.findById.mockResolvedValue(
      new Category({ id: 'cat-1', name: 'Backend', slug: 'backend' }),
    );

    await handler.execute(new DeleteCategoryCommand('cat-1'));

    expect(categoryRepository.delete).toHaveBeenCalledWith('cat-1');
  });

  it('throws CategoryInUseException and does not delete when jobs still reference it', async () => {
    categoryRepository.findById.mockResolvedValue(
      new Category({ id: 'cat-1', name: 'Backend', slug: 'backend' }),
    );
    categoryRepository.countReferencingJobs.mockResolvedValue(3);

    await expect(
      handler.execute(new DeleteCategoryCommand('cat-1')),
    ).rejects.toThrow(CategoryInUseException);
    expect(categoryRepository.delete).not.toHaveBeenCalled();
  });
});
