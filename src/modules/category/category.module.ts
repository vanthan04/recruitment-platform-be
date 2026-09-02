import { Module } from '@nestjs/common';
import { CategoryController } from '@/modules/category/presentation/controllers/category.controller';
import { ICategoryRepository } from '@/modules/category/domain/repositories/category.repository';
import { CategoryInfraRepository } from '@/modules/category/infrastructure/repositories/category.infra-repository';
import { CategoryPrismaRepository } from '@/modules/category/infrastructure/persistence/prisma/category-prisma.repository';

import { CreateCategoryUseCase } from '@/modules/category/application/use-cases/create-category.use-case';
import { UpdateCategoryUseCase } from '@/modules/category/application/use-cases/update-category.use-case';
import { ListCategoriesUseCase } from '@/modules/category/application/use-cases/list-categories.use-case';
import { DeleteCategoryUseCase } from '@/modules/category/application/use-cases/delete-category.use-case';

@Module({
  controllers: [CategoryController],
  providers: [
    CategoryPrismaRepository,
    {
      provide: ICategoryRepository,
      useClass: CategoryInfraRepository,
    },
    CreateCategoryUseCase,
    UpdateCategoryUseCase,
    ListCategoriesUseCase,
    DeleteCategoryUseCase,
  ],
  exports: [ICategoryRepository],
})
export class CategoryModule {}
