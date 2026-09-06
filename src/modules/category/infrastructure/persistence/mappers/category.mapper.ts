import { Category } from '@/modules/category/domain/entities/category.entity';
import { Category as PrismaCategory, Prisma } from '@prisma/client';

export class CategoryMapper {
  static toDomain(raw: PrismaCategory | null): Category | null {
    if (!raw) return null;

    return new Category({
      id: raw.id,
      name: raw.name,
      slug: raw.slug,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPersistence(category: Category): Prisma.CategoryCreateInput {
    return {
      name: category.name,
      slug: category.slug,
    };
  }
}
