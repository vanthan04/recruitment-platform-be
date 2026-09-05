import { CategoryLookupAdapter } from './category-lookup.adapter';
import { ICategoryRepository } from '@/modules/category/domain/repositories/category.repository';
import { Category } from '@/modules/category/domain/entities/category.entity';

describe('CategoryLookupAdapter', () => {
  it('batches all requested ids into a single findManyByIds call', async () => {
    const categoryRepository: jest.Mocked<Pick<ICategoryRepository, 'findManyByIds'>> = {
      findManyByIds: jest.fn().mockResolvedValue([
        new Category({ id: 'cat-1', name: 'Backend', slug: 'backend' }),
      ]),
    };
    const adapter = new CategoryLookupAdapter(categoryRepository as any);

    const result = await adapter.findManyByIds(['cat-1', 'cat-1', 'cat-2']);

    expect(categoryRepository.findManyByIds).toHaveBeenCalledTimes(1);
    expect(categoryRepository.findManyByIds).toHaveBeenCalledWith([
      'cat-1',
      'cat-2',
    ]);
    expect(result.get('cat-1')).toEqual({
      id: 'cat-1',
      name: 'Backend',
      slug: 'backend',
    });
    expect(result.has('cat-2')).toBe(false);
  });
});
