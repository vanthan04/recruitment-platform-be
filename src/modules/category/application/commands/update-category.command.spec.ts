import {
  UpdateCategoryCommand,
  UpdateCategoryHandler,
} from '@/modules/category/application/commands/update-category.command';
import { ICategoryRepository } from '@/modules/category/domain/repositories/category.repository';
import { CategoryNotFoundException } from '@/modules/category/domain/exceptions/category.exceptions';
import { Category } from '@/modules/category/domain/entities/category.entity';

describe('UpdateCategoryHandler', () => {
  let handler: UpdateCategoryHandler;
  let categoryRepository: jest.Mocked<ICategoryRepository>;

  beforeEach(() => {
    categoryRepository = {
      findById: jest.fn(),
      existsBySlug: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    handler = new UpdateCategoryHandler(categoryRepository);
  });

  it('throws CategoryNotFoundException when the category does not exist', async () => {
    categoryRepository.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new UpdateCategoryCommand('cat-1', 'New Name')),
    ).rejects.toThrow(CategoryNotFoundException);
    expect(categoryRepository.update).not.toHaveBeenCalled();
  });

  it('updates the category name and persists it', async () => {
    const category = new Category({
      id: 'cat-1',
      name: 'Old Name',
      slug: 'old-name',
    });
    categoryRepository.findById.mockResolvedValue(category);
    categoryRepository.update.mockImplementation(async (c) => c);

    const result = await handler.execute(
      new UpdateCategoryCommand('cat-1', 'New Name'),
    );

    expect(result.name).toBe('New Name');
    expect(categoryRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'cat-1', name: 'New Name' }),
    );
  });
});
