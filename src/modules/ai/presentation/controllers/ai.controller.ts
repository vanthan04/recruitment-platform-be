import { Controller, Post, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionGuard } from '@/common/guards/permission.guard';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { GetMe } from '@/common/decorators/get-me.decorator';
import { Permission } from '@/common/enums/permission.enum';
import { ApiResponse } from '@/common/dtos/api-response';
import { AiMatchingService } from '@/modules/ai/application/services/ai-matching.service';
import { MatchingCandidatesResponseDto } from '@/modules/ai/presentation/dtos/matching-candidates-response.dto';

@ApiTags('ai')
@Controller('jobs')
export class AiController {
  constructor(private readonly aiMatchingService: AiMatchingService) {}

  @Post(':jobId/matching-candidates')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions(Permission.JOB_MATCH_CANDIDATES)
  @ApiOperation({
    summary:
      'AI-assisted candidate matching for a job (Recruiter owner only) — recommendations only, never mutates any application/CV/job data',
  })
  @ApiParam({
    name: 'jobId',
    description: 'The job to find matching candidates for',
  })
  @ApiOkResponse({ type: MatchingCandidatesResponseDto })
  async findMatchingCandidates(
    @GetMe('id') recruiterId: string,
    @Param('jobId') jobId: string,
  ) {
    const result = await this.aiMatchingService.findMatchingCandidates(
      recruiterId,
      jobId,
    );
    return ApiResponse.ok(result, 'Matching candidates retrieved successfully');
  }
}
