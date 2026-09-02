import { Category } from '@/modules/category/domain/entities/category.entity';
export declare abstract class ICategoryRepository {
    abstract findById(id: string): Promise<Category | null>;
    abstract existsBySlug(slug: string): Promise<boolean>;
    abstract findAll(): Promise<Category[]>;
    abstract save(category: Category): Promise<Category>;
    abstract update(category: Category): Promise<Category>;
    abstract delete(id: string): Promise<void>;
}
