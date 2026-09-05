import { Category } from '@/modules/category/domain/entities/category.entity';

/**
 * Category Repository interface (port).
 * Defined in the domain layer — implementation lives in infrastructure.
 */
export abstract class ICategoryRepository {
  abstract findById(id: string): Promise<Category | null>;
  abstract findManyByIds(ids: string[]): Promise<Category[]>;
  abstract existsBySlug(slug: string): Promise<boolean>;
  abstract findAll(): Promise<Category[]>;
  /** How many (non-deleted) jobs currently reference this category — used to block deleting a category still in use. */
  abstract countReferencingJobs(categoryId: string): Promise<number>;
  abstract save(category: Category): Promise<Category>;
  abstract update(category: Category): Promise<Category>;
  abstract delete(id: string): Promise<void>;
}
