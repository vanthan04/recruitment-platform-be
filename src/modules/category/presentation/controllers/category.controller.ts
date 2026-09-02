import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/presentation/security/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/enums/user-role.enum';
import { ApiResponse } from '@/common/dtos/api-response';

import { CreateCategoryUseCase } from '@/modules/category/application/use-cases/create-category.use-case';
import { UpdateCategoryUseCase } from '@/modules/category/application/use-cases/update-category.use-case';
import { ListCategoriesUseCase } from '@/modules/category/application/use-cases/list-categories.use-case';
import { DeleteCategoryUseCase } from '@/modules/category/application/use-cases/delete-category.use-case';

import { CreateCategoryDto } from '@/modules/category/presentation/dtos/create-category.dto';
import { UpdateCategoryDto } from '@/modules/category/presentation/dtos/update-category.dto';

@ApiTags('categories')
@Controller('categories')
export class CategoryController {
  constructor(
    private readonly createCategoryUseCase: CreateCategoryUseCase,
    private readonly updateCategoryUseCase: UpdateCategoryUseCase,
    private readonly listCategoriesUseCase: ListCategoriesUseCase,
    private readonly deleteCategoryUseCase: DeleteCategoryUseCase,
  ) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a job category (Admin only)' })
  async create(@Body() dto: CreateCategoryDto) {
    const result = await this.createCategoryUseCase.execute(dto);
    return ApiResponse.ok(result, 'Category created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'List all job categories (public)' })
  async list() {
    const result = await this.listCategoriesUseCase.execute();
    return ApiResponse.ok(result, 'Categories retrieved successfully');
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a job category (Admin only)' })
  async update(@Param('id') categoryId: string, @Body() dto: UpdateCategoryDto) {
    const result = await this.updateCategoryUseCase.execute(categoryId, dto.name!);
    return ApiResponse.ok(result, 'Category updated successfully');
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a job category (Admin only)' })
  async delete(@Param('id') categoryId: string) {
    await this.deleteCategoryUseCase.execute(categoryId);
  }
}
