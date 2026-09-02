import { Category } from '@/modules/category/domain/entities/category.entity';

export class CategoryMapper {
  static toDomain(raw: any): Category | null {
    if (!raw) return null;

    return new Category({
      id: raw.id,
      name: raw.name,
      slug: raw.slug,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPersistence(category: Category): any {
    return {
      name: category.name,
      slug: category.slug,
    };
  }
}
