import { Body, Controller, Post, Param, UseGuards } from '@nestjs/common';
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
import { ScreeningService } from '@/modules/ai/application/services/screening.service';
import { SkillSuggestionService } from '@/modules/ai/application/services/skill-suggestion.service';
import { JobDraftService } from '@/modules/ai/application/services/job-draft.service';
import { MatchingCandidatesResponseDto } from '@/modules/ai/presentation/dtos/matching-candidates-response.dto';
import { AskScreeningQuestionDto } from '@/modules/ai/presentation/dtos/ask-screening-question.dto';
import { ScreeningAnswerResponseDto } from '@/modules/ai/presentation/dtos/screening-answer-response.dto';
import { SuggestJobSkillsDto } from '@/modules/ai/presentation/dtos/suggest-job-skills.dto';
import { SuggestedSkillsResponseDto } from '@/modules/ai/presentation/dtos/suggested-skills-response.dto';
import { DraftJobDto } from '@/modules/ai/presentation/dtos/draft-job.dto';
import { JobDraftResponseDto } from '@/modules/ai/presentation/dtos/job-draft-response.dto';

@ApiTags('ai')
@Controller('jobs')
export class AiController {
  constructor(
    private readonly aiMatchingService: AiMatchingService,
    private readonly screeningService: ScreeningService,
    private readonly skillSuggestionService: SkillSuggestionService,
    private readonly jobDraftService: JobDraftService,
  ) {}

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

  @Post(':jobId/candidates/:candidateId/screening-questions')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions(Permission.CANDIDATE_SCREEN)
  @ApiOperation({
    summary:
      'Ask an AI screening question about one candidate for a job (Recruiter owner only) — read-only, never mutates any application/CV/job data',
  })
  @ApiParam({
    name: 'jobId',
    description: 'The job this candidate is being screened for',
  })
  @ApiParam({
    name: 'candidateId',
    description: 'The candidate being screened',
  })
  @ApiOkResponse({ type: ScreeningAnswerResponseDto })
  async askScreeningQuestion(
    @GetMe('id') recruiterId: string,
    @Param('jobId') jobId: string,
    @Param('candidateId') candidateId: string,
    @Body() dto: AskScreeningQuestionDto,
  ) {
    const answer = await this.screeningService.askQuestion(
      recruiterId,
      jobId,
      candidateId,
      dto.question,
      dto.priorMessages,
    );
    return ApiResponse.ok(
      { jobId, candidateId, answer },
      'Screening answer generated successfully',
    );
  }

  @Post('skill-suggestions')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions(Permission.JOB_CREATE)
  @ApiOperation({
    summary:
      "Suggest skills from the platform's existing taxonomy for a job title/description (Recruiter only) — never invents a skill outside the taxonomy",
  })
  @ApiOkResponse({ type: SuggestedSkillsResponseDto })
  async suggestJobSkills(@Body() dto: SuggestJobSkillsDto) {
    const suggestedSkills = await this.skillSuggestionService.suggestSkills(
      dto.title,
      dto.description,
    );
    return ApiResponse.ok(
      { suggestedSkills },
      'Skill suggestions generated successfully',
    );
  }

  @Post('draft')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions(Permission.JOB_CREATE)
  @ApiOperation({
    summary:
      'Draft a job posting from rough notes (Recruiter only) — draft only, never creates a job; review and submit via POST /jobs to actually post it',
  })
  @ApiOkResponse({ type: JobDraftResponseDto })
  async draftJob(@Body() dto: DraftJobDto) {
    const draft = await this.jobDraftService.draftJob(dto.hints);
    return ApiResponse.ok(draft, 'Job draft generated successfully');
  }
}
