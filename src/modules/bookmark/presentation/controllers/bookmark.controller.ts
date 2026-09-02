import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { GetMe } from '@/common/decorators/get-me.decorator';
import { UserRole } from '@/common/enums/user-role.enum';
import { ApiResponse } from '@/common/dtos/api-response';

import { ToggleBookmarkCommand } from '@/modules/bookmark/application/commands/toggle-bookmark.command';
import { ListBookmarksQuery } from '@/modules/bookmark/application/queries/list-bookmarks.query';

@ApiTags('bookmarks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bookmarks')
export class BookmarkController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('toggle/:jobId')
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: 'Toggle bookmark for a job (Candidate only)' })
  async toggle(@GetMe('id') userId: string, @Param('jobId') jobId: string) {
    const result = await this.commandBus.execute(new ToggleBookmarkCommand(userId, jobId));
    return ApiResponse.ok(result, result.bookmarked ? 'Job bookmarked' : 'Bookmark removed');
  }

  @Get()
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: 'List my bookmarked jobs (Candidate only)' })
  async list(@GetMe('id') userId: string) {
    const result = await this.queryBus.execute(new ListBookmarksQuery(userId));
    return ApiResponse.ok(result, 'Bookmarks retrieved successfully');
  }
}
