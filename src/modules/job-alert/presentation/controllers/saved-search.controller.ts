import { Controller, Get, Post, Delete, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/presentation/security/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { GetMe } from '@/common/decorators/get-me.decorator';
import { UserRole } from '@/common/enums/user-role.enum';
import { ApiResponse } from '@/common/dtos/api-response';

import { CreateSavedSearchUseCase } from '@/modules/job-alert/application/use-cases/create-saved-search.use-case';
import { ListMySavedSearchesUseCase } from '@/modules/job-alert/application/use-cases/list-my-saved-searches.use-case';
import { DeleteSavedSearchUseCase } from '@/modules/job-alert/application/use-cases/delete-saved-search.use-case';
import { CreateSavedSearchDto } from '@/modules/job-alert/presentation/dtos/create-saved-search.dto';

@ApiTags('saved-searches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('saved-searches')
export class SavedSearchController {
  constructor(
    private readonly createSavedSearchUseCase: CreateSavedSearchUseCase,
    private readonly listMySavedSearchesUseCase: ListMySavedSearchesUseCase,
    private readonly deleteSavedSearchUseCase: DeleteSavedSearchUseCase,
  ) {}

  @Post()
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: 'Save a search to get emailed when matching jobs are posted (Candidate only)' })
  async create(@GetMe('id') userId: string, @Body() dto: CreateSavedSearchDto) {
    const result = await this.createSavedSearchUseCase.execute(userId, dto);
    return ApiResponse.ok(result, 'Saved search created successfully');
  }

  @Get()
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: 'List my saved searches (Candidate only)' })
  async list(@GetMe('id') userId: string) {
    const result = await this.listMySavedSearchesUseCase.execute(userId);
    return ApiResponse.ok(result, 'Saved searches retrieved successfully');
  }

  @Delete(':id')
  @Roles(UserRole.CANDIDATE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a saved search (owner only)' })
  async delete(@GetMe('id') userId: string, @Param('id') savedSearchId: string) {
    await this.deleteSavedSearchUseCase.execute(userId, savedSearchId);
  }
}
