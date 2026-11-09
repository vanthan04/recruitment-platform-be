import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionGuard } from '@/common/guards/permission.guard';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { GetMe } from '@/common/decorators/get-me.decorator';
import { Permission } from '@/common/enums/permission.enum';
import { ApiResponse } from '@/common/dtos/api-response';

import { ListDetectionEventsQuery } from '@/modules/monitoring/application/queries/list-detection-events.query';
import { GetDetectionSummaryQuery } from '@/modules/monitoring/application/queries/get-detection-summary.query';
import { ReviewDetectionEventCommand } from '@/modules/monitoring/application/commands/review-detection-event.command';
import {
  ListDetectionEventsDto,
  ReviewDetectionEventDto,
} from '@/modules/monitoring/presentation/dtos/detection-events.dto';

/**
 * Monitoring events of an interview. Reading: the candidate and the job's
 * recruiter (interview:read; the participant check is in each handler).
 * Reviewing: the job's recruiter only (interview:update, which candidates
 * don't hold, plus the same participant check).
 */
@ApiTags('monitoring')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller()
export class MonitoringController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('interviews/:id/detection-events')
  @RequirePermissions(Permission.INTERVIEW_READ)
  @ApiOperation({
    summary:
      'Monitoring events of an interview, oldest first (participants only)',
  })
  async list(
    @GetMe('id') userId: string,
    @Param('id') interviewId: string,
    @Query() query: ListDetectionEventsDto,
  ) {
    const result = await this.queryBus.execute(
      new ListDetectionEventsQuery(
        userId,
        interviewId,
        {
          eventType: query.eventType,
          sessionId: query.sessionId,
          reviewed: query.reviewed,
        },
        query.page ?? 1,
        query.limit ?? 20,
      ),
    );
    return ApiResponse.ok(result.events, 'Monitoring events retrieved', {
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  }

  @Get('interviews/:id/detection-summary')
  @RequirePermissions(Permission.INTERVIEW_READ)
  @ApiOperation({
    summary:
      'Monitoring event counts per type and per session (participants only)',
  })
  async summary(@GetMe('id') userId: string, @Param('id') interviewId: string) {
    const result = await this.queryBus.execute(
      new GetDetectionSummaryQuery(userId, interviewId),
    );
    return ApiResponse.ok(result, 'Monitoring summary retrieved');
  }

  @Patch('monitoring/events/:id/review')
  @RequirePermissions(Permission.INTERVIEW_UPDATE)
  @ApiOperation({
    summary:
      "Mark a monitoring event reviewed, with an optional private note (job's recruiter only)",
  })
  async review(
    @GetMe('id') userId: string,
    @Param('id') eventId: string,
    @Body() body: ReviewDetectionEventDto,
  ) {
    const result = await this.commandBus.execute(
      new ReviewDetectionEventCommand(userId, eventId, body.note ?? null),
    );
    return ApiResponse.ok(result, 'Monitoring event reviewed');
  }
}
