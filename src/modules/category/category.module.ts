import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CategoryController } from '@/modules/category/presentation/controllers/category.controller';
import { ICategoryRepository } from '@/modules/category/domain/repositories/category.repository';
import { CategoryPrismaRepository } from '@/modules/category/infrastructure/category-prisma.repository';

import { CreateCategoryHandler } from '@/modules/category/application/commands/create-category.command';
import { UpdateCategoryHandler } from '@/modules/category/application/commands/update-category.command';
import { DeleteCategoryHandler } from '@/modules/category/application/commands/delete-category.command';
import { ListCategoriesHandler } from '@/modules/category/application/queries/list-categories.query';

@Module({
  imports: [CqrsModule],
  controllers: [CategoryController],
  providers: [
    {
      provide: ICategoryRepository,
      useClass: CategoryPrismaRepository,
    },
    CreateCategoryHandler,
    UpdateCategoryHandler,
    DeleteCategoryHandler,
    ListCategoriesHandler,
  ],
  exports: [ICategoryRepository],
})
export class CategoryModule {}
