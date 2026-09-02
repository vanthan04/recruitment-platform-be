import { ICategoryRepository } from '@/modules/category/domain/repositories/category.repository';
import { Category } from '@/modules/category/domain/entities/category.entity';
import { CategoryPrismaRepository } from '@/modules/category/infrastructure/persistence/prisma/category-prisma.repository';
export declare class CategoryInfraRepository implements ICategoryRepository {
    private readonly categoryPrisma;
    constructor(categoryPrisma: CategoryPrismaRepository);
    findById(id: string): Promise<Category | null>;
    existsBySlug(slug: string): Promise<boolean>;
    findAll(): Promise<Category[]>;
    save(category: Category): Promise<Category>;
    update(category: Category): Promise<Category>;
    delete(id: string): Promise<void>;
}
