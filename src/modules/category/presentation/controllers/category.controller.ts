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
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/enums/user-role.enum';
import { ApiResponse } from '@/common/dtos/api-response';

import { CreateCategoryCommand } from '@/modules/category/application/commands/create-category.command';
import { UpdateCategoryCommand } from '@/modules/category/application/commands/update-category.command';
import { DeleteCategoryCommand } from '@/modules/category/application/commands/delete-category.command';
import { ListCategoriesQuery } from '@/modules/category/application/queries/list-categories.query';

import { CreateCategoryDto } from '@/modules/category/presentation/dtos/create-category.dto';
import { UpdateCategoryDto } from '@/modules/category/presentation/dtos/update-category.dto';

@ApiTags('categories')
@Controller('categories')
export class CategoryController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a job category (Admin only)' })
  async create(@Body() dto: CreateCategoryDto) {
    const result = await this.commandBus.execute(new CreateCategoryCommand(dto.name));
    return ApiResponse.ok(result, 'Category created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'List all job categories (public)' })
  async list() {
    const result = await this.queryBus.execute(new ListCategoriesQuery());
    return ApiResponse.ok(result, 'Categories retrieved successfully');
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a job category (Admin only)' })
  async update(@Param('id') categoryId: string, @Body() dto: UpdateCategoryDto) {
    const result = await this.commandBus.execute(new UpdateCategoryCommand(categoryId, dto.name!));
    return ApiResponse.ok(result, 'Category updated successfully');
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a job category (Admin only)' })
  async delete(@Param('id') categoryId: string) {
    await this.commandBus.execute(new DeleteCategoryCommand(categoryId));
  }
}
