import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionGuard } from '@/common/guards/permission.guard';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { GetMe } from '@/common/decorators/get-me.decorator';
import { Permission } from '@/common/enums/permission.enum';
import { ApiResponse } from '@/common/dtos/api-response';
import {
  GetJobRecommendationsQuery,
  MAX_RECOMMENDATIONS,
} from '@/modules/ai/application/queries/get-job-recommendations.query';

export class JobRecommendationsQueryDto {
  @ApiPropertyOptional({
    minimum: 1,
    maximum: MAX_RECOMMENDATIONS,
    default: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_RECOMMENDATIONS)
  @IsOptional()
  readonly limit?: number = 10;
}

// Its own path, not `/jobs/recommended`: JobController's `GET /jobs/:id`
// would claim that path whenever its routes are registered first.
@ApiTags('job-recommendations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('job-recommendations')
export class JobRecommendationController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  // Reuses APPLICATION_CREATE ("can apply for jobs" — candidates only) rather
  // than a new permission: a new one in prisma/seed.ts is not granted on an
  // already-seeded environment (the role-permission block only seeds roles
  // with no permissions yet), so it would need a manual grant on every
  // existing deployment. "Jobs worth applying to" sits naturally with it.
  @RequirePermissions(Permission.APPLICATION_CREATE)
  @ApiOperation({
    summary:
      'Jobs that match the skills in my analyzed CVs, best first (Candidate only)',
  })
  async list(
    @GetMe('id') userId: string,
    @Query() query: JobRecommendationsQueryDto,
  ) {
    const result = await this.queryBus.execute(
      new GetJobRecommendationsQuery(userId, query.limit ?? 10),
    );
    return ApiResponse.ok(result, 'Job recommendations retrieved successfully');
  }
}
