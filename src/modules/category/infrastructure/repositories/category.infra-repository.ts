import { Injectable } from '@nestjs/common';
import { ICategoryRepository } from '@/modules/category/domain/repositories/category.repository';
import { Category } from '@/modules/category/domain/entities/category.entity';
import { CategoryPrismaRepository } from '@/modules/category/infrastructure/persistence/prisma/category-prisma.repository';
import { CategoryMapper } from '@/modules/category/infrastructure/persistence/mappers/category.mapper';

@Injectable()
export class CategoryInfraRepository implements ICategoryRepository {
  constructor(private readonly categoryPrisma: CategoryPrismaRepository) {}

  async findById(id: string): Promise<Category | null> {
    const raw = await this.categoryPrisma.findById(id);
    return CategoryMapper.toDomain(raw);
  }

  async existsBySlug(slug: string): Promise<boolean> {
    return this.categoryPrisma.existsBySlug(slug);
  }

  async findAll(): Promise<Category[]> {
    const raws = await this.categoryPrisma.findAll();
    return raws.map((r) => CategoryMapper.toDomain(r)!);
  }

  async save(category: Category): Promise<Category> {
    const data = CategoryMapper.toPersistence(category);
    const raw = await this.categoryPrisma.create(data);
    return CategoryMapper.toDomain(raw)!;
  }

  async update(category: Category): Promise<Category> {
    const data = CategoryMapper.toPersistence(category);
    const raw = await this.categoryPrisma.update(category.id, data);
    return CategoryMapper.toDomain(raw)!;
  }

  async delete(id: string): Promise<void> {
    await this.categoryPrisma.delete(id);
  }
}
