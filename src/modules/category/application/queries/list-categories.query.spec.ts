import {
  ListCategoriesQuery,
  ListCategoriesHandler,
} from '@/modules/category/application/queries/list-categories.query';
import { ICategoryRepository } from '@/modules/category/domain/repositories/category.repository';
import { Category } from '@/modules/category/domain/entities/category.entity';

describe('ListCategoriesHandler', () => {
  let handler: ListCategoriesHandler;
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

    handler = new ListCategoriesHandler(categoryRepository);
  });

  it('maps all categories to response DTOs', async () => {
    categoryRepository.findAll.mockResolvedValue([
      new Category({ id: 'cat-1', name: 'Backend', slug: 'backend' }),
      new Category({ id: 'cat-2', name: 'Frontend', slug: 'frontend' }),
    ]);

    const result = await handler.execute(new ListCategoriesQuery());

    expect(result).toHaveLength(2);
    expect(result.map((c) => c.slug)).toEqual(['backend', 'frontend']);
  });
});
