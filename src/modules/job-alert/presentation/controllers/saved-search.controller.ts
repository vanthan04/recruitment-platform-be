import {
  Controller,
  Get,
  Post,
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
import { PermissionGuard } from '@/common/guards/permission.guard';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { GetMe } from '@/common/decorators/get-me.decorator';
import { Permission } from '@/common/enums/permission.enum';
import { ApiResponse } from '@/common/dtos/api-response';

import { CreateSavedSearchCommand } from '@/modules/job-alert/application/commands/create-saved-search.command';
import { DeleteSavedSearchCommand } from '@/modules/job-alert/application/commands/delete-saved-search.command';
import { ListMySavedSearchesQuery } from '@/modules/job-alert/application/queries/list-my-saved-searches.query';
import { CreateSavedSearchDto } from '@/modules/job-alert/presentation/dtos/create-saved-search.dto';

@ApiTags('saved-searches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('saved-searches')
export class SavedSearchController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @RequirePermissions(Permission.SAVED_SEARCH_CREATE)
  @ApiOperation({
    summary:
      'Save a search to get emailed when matching jobs are posted (Candidate only)',
  })
  async create(@GetMe('id') userId: string, @Body() dto: CreateSavedSearchDto) {
    const result = await this.commandBus.execute(
      new CreateSavedSearchCommand(userId, dto),
    );
    return ApiResponse.ok(result, 'Saved search created successfully');
  }

  @Get()
  @RequirePermissions(Permission.SAVED_SEARCH_READ)
  @ApiOperation({ summary: 'List my saved searches (Candidate only)' })
  async list(@GetMe('id') userId: string) {
    const result = await this.queryBus.execute(
      new ListMySavedSearchesQuery(userId),
    );
    return ApiResponse.ok(result, 'Saved searches retrieved successfully');
  }

  @Delete(':id')
  @RequirePermissions(Permission.SAVED_SEARCH_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a saved search (owner only)' })
  async delete(
    @GetMe('id') userId: string,
    @Param('id') savedSearchId: string,
  ) {
    await this.commandBus.execute(
      new DeleteSavedSearchCommand(userId, savedSearchId),
    );
  }
}
