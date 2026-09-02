import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CategoryController } from '@/modules/category/presentation/controllers/category.controller';
import { ICategoryRepository } from '@/modules/category/domain/repositories/category.repository';
import { CategoryInfraRepository } from '@/modules/category/infrastructure/repositories/category.infra-repository';
import { CategoryPrismaRepository } from '@/modules/category/infrastructure/persistence/prisma/category-prisma.repository';

import { CreateCategoryHandler } from '@/modules/category/application/commands/create-category.command';
import { UpdateCategoryHandler } from '@/modules/category/application/commands/update-category.command';
import { DeleteCategoryHandler } from '@/modules/category/application/commands/delete-category.command';
import { ListCategoriesHandler } from '@/modules/category/application/queries/list-categories.query';

@Module({
  imports: [CqrsModule],
  controllers: [CategoryController],
  providers: [
    CategoryPrismaRepository,
    {
      provide: ICategoryRepository,
      useClass: CategoryInfraRepository,
    },
    CreateCategoryHandler,
    UpdateCategoryHandler,
    DeleteCategoryHandler,
    ListCategoriesHandler,
  ],
  exports: [ICategoryRepository],
})
export class CategoryModule {}
