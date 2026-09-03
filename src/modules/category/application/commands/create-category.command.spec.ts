import {
  CreateCategoryCommand,
  CreateCategoryHandler,
} from '@/modules/category/application/commands/create-category.command';
import { ICategoryRepository } from '@/modules/category/domain/repositories/category.repository';

describe('CreateCategoryHandler', () => {
  let handler: CreateCategoryHandler;
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

    handler = new CreateCategoryHandler(categoryRepository);
  });

  it('slugifies the name and saves the category', async () => {
    categoryRepository.existsBySlug.mockResolvedValue(false);
    categoryRepository.save.mockImplementation(async (c) => c);

    const result = await handler.execute(
      new CreateCategoryCommand('Backend Development'),
    );

    expect(result.slug).toBe('backend-development');
    expect(categoryRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Backend Development',
        slug: 'backend-development',
      }),
    );
  });

  it('appends a numeric suffix when the base slug is already taken', async () => {
    categoryRepository.existsBySlug.mockImplementation(
      async (slug) => slug === 'backend-development',
    );
    categoryRepository.save.mockImplementation(async (c) => c);

    const result = await handler.execute(
      new CreateCategoryCommand('Backend Development'),
    );

    expect(result.slug).toBe('backend-development-2');
  });

  it('keeps incrementing the suffix while candidates collide', async () => {
    const taken = new Set([
      'backend-development',
      'backend-development-2',
      'backend-development-3',
    ]);
    categoryRepository.existsBySlug.mockImplementation(async (slug) =>
      taken.has(slug),
    );
    categoryRepository.save.mockImplementation(async (c) => c);

    const result = await handler.execute(
      new CreateCategoryCommand('Backend Development'),
    );

    expect(result.slug).toBe('backend-development-4');
  });
});
