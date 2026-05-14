import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/presentation/security/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { GetMe } from '@/common/decorators/get-me.decorator';
import { UserRole } from '@/common/enums/user-role.enum';
import { ApiResponse } from '@/common/dtos/api-response';

import { ToggleBookmarkUseCase } from '@/modules/bookmark/application/use-cases/toggle-bookmark.use-case';
import { ListBookmarksUseCase } from '@/modules/bookmark/application/use-cases/list-bookmarks.use-case';

@ApiTags('bookmarks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bookmarks')
export class BookmarkController {
  constructor(
    private readonly toggleBookmarkUseCase: ToggleBookmarkUseCase,
    private readonly listBookmarksUseCase: ListBookmarksUseCase,
  ) {}

  @Post('toggle/:jobId')
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: 'Toggle bookmark for a job (Candidate only)' })
  async toggle(@GetMe('id') userId: string, @Param('jobId') jobId: string) {
    const result = await this.toggleBookmarkUseCase.execute(userId, jobId);
    return ApiResponse.ok(result, result.bookmarked ? 'Job bookmarked' : 'Bookmark removed');
  }

  @Get()
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: 'List my bookmarked jobs (Candidate only)' })
  async list(@GetMe('id') userId: string) {
    const result = await this.listBookmarksUseCase.execute(userId);
    return ApiResponse.ok(result, 'Bookmarks retrieved successfully');
  }
}
