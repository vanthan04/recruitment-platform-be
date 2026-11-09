import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  HttpCode,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionGuard } from '@/common/guards/permission.guard';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { GetMe } from '@/common/decorators/get-me.decorator';
import { Permission } from '@/common/enums/permission.enum';
import { ApiResponse } from '@/common/dtos/api-response';

import { ScheduleInterviewCommand } from '@/modules/interview/application/commands/schedule-interview.command';
import { RescheduleInterviewCommand } from '@/modules/interview/application/commands/reschedule-interview.command';
import { CancelInterviewCommand } from '@/modules/interview/application/commands/cancel-interview.command';
import { CompleteInterviewCommand } from '@/modules/interview/application/commands/complete-interview.command';
import { MarkInterviewNoShowCommand } from '@/modules/interview/application/commands/mark-interview-no-show.command';
import { ListInterviewsByApplicationQuery } from '@/modules/interview/application/queries/list-interviews-by-application.query';

import { StartInterviewSessionCommand } from '@/modules/interview/application/commands/start-interview-session.command';
import { EndInterviewSessionCommand } from '@/modules/interview/application/commands/end-interview-session.command';
import { GetRoomJoinInfoQuery } from '@/modules/interview/application/queries/get-room-join-info.query';
import { GetInterviewQuery } from '@/modules/interview/application/queries/get-interview.query';
import { ListMyInterviewsQuery } from '@/modules/interview/application/queries/list-my-interviews.query';
import { ListInterviewSessionsQuery } from '@/modules/interview/application/queries/list-interview-sessions.query';
import { ListInterviewsDto } from '@/modules/interview/presentation/dtos/list-interviews.dto';

import { ScheduleInterviewDto } from '@/modules/interview/presentation/dtos/schedule-interview.dto';
import { RescheduleInterviewDto } from '@/modules/interview/presentation/dtos/reschedule-interview.dto';

@ApiTags('interviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('interviews')
export class InterviewController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @RequirePermissions(Permission.INTERVIEW_CREATE)
  @ApiOperation({
    summary:
      'Schedule an interview for a job application (Recruiter owner only)',
  })
  async schedule(
    @GetMe('id') recruiterId: string,
    @Body() dto: ScheduleInterviewDto,
  ) {
    const result = await this.commandBus.execute(
      new ScheduleInterviewCommand(recruiterId, dto),
    );
    return ApiResponse.ok(result, 'Interview scheduled successfully');
  }

  @Patch(':id')
  @RequirePermissions(Permission.INTERVIEW_UPDATE)
  @ApiOperation({ summary: 'Reschedule an interview (Recruiter owner only)' })
  async reschedule(
    @GetMe('id') recruiterId: string,
    @Param('id') id: string,
    @Body() dto: RescheduleInterviewDto,
  ) {
    const result = await this.commandBus.execute(
      new RescheduleInterviewCommand(recruiterId, id, dto),
    );
    return ApiResponse.ok(result, 'Interview rescheduled successfully');
  }

  @Patch(':id/cancel')
  @RequirePermissions(Permission.INTERVIEW_UPDATE)
  @ApiOperation({ summary: 'Cancel an interview (Recruiter owner only)' })
  async cancel(@GetMe('id') recruiterId: string, @Param('id') id: string) {
    const result = await this.commandBus.execute(
      new CancelInterviewCommand(recruiterId, id),
    );
    return ApiResponse.ok(result, 'Interview cancelled successfully');
  }

  @Patch(':id/complete')
  @RequirePermissions(Permission.INTERVIEW_UPDATE)
  @ApiOperation({
    summary: 'Mark an interview as completed (Recruiter owner only)',
  })
  async complete(@GetMe('id') recruiterId: string, @Param('id') id: string) {
    const result = await this.commandBus.execute(
      new CompleteInterviewCommand(recruiterId, id),
    );
    return ApiResponse.ok(result, 'Interview marked as completed');
  }

  @Patch(':id/no-show')
  @RequirePermissions(Permission.INTERVIEW_UPDATE)
  @ApiOperation({
    summary: 'Mark the candidate as a no-show (Recruiter owner only)',
  })
  async markNoShow(@GetMe('id') recruiterId: string, @Param('id') id: string) {
    const result = await this.commandBus.execute(
      new MarkInterviewNoShowCommand(recruiterId, id),
    );
    return ApiResponse.ok(result, 'Interview marked as no-show');
  }

  // The routes below are open to any holder of INTERVIEW_READ (candidates and
  // recruiters). Real access control is the participant check in each handler
  // (candidate = application.userId, recruiter = job.postedById, both read from
  // the DB). Starting/ending a session reuses INTERVIEW_READ on purpose: the
  // seed only wires a *new* permission into a role's defaults on first run, so
  // a dedicated permission would silently be missing on every existing database.

  @Get()
  @RequirePermissions(Permission.INTERVIEW_READ)
  @ApiOperation({
    summary:
      'List interviews I take part in, as candidate or job-owning recruiter (paginated)',
  })
  async list(@GetMe('id') userId: string, @Query() query: ListInterviewsDto) {
    const result = await this.queryBus.execute(
      new ListMyInterviewsQuery(
        userId,
        query.page ?? 1,
        query.limit ?? 10,
        query.status,
        query.upcoming,
      ),
    );
    return ApiResponse.ok(
      result.interviews,
      'Interviews retrieved successfully',
      {
        total: result.total,
        page: result.page,
        limit: result.limit,
      },
    );
  }

  @Get(':id')
  @RequirePermissions(Permission.INTERVIEW_READ)
  @ApiOperation({ summary: 'Get one interview (participants only)' })
  async getOne(@GetMe('id') userId: string, @Param('id') id: string) {
    const result = await this.queryBus.execute(
      new GetInterviewQuery(userId, id),
    );
    return ApiResponse.ok(result, 'Interview retrieved successfully');
  }

  @Get(':id/sessions')
  @RequirePermissions(Permission.INTERVIEW_READ)
  @ApiOperation({
    summary: 'List sessions of an interview (participants only)',
  })
  async listSessions(@GetMe('id') userId: string, @Param('id') id: string) {
    const result = await this.queryBus.execute(
      new ListInterviewSessionsQuery(userId, id),
    );
    return ApiResponse.ok(result, 'Interview sessions retrieved successfully');
  }

  @Post(':id/sessions')
  @RequirePermissions(Permission.INTERVIEW_READ)
  @ApiOperation({
    summary: 'Start a session of a pending interview (participants only)',
  })
  async startSession(@GetMe('id') userId: string, @Param('id') id: string) {
    const result = await this.commandBus.execute(
      new StartInterviewSessionCommand(userId, id),
    );
    return ApiResponse.ok(result, 'Interview session started');
  }

  @Post(':id/room/join')
  @HttpCode(200)
  @RequirePermissions(Permission.INTERVIEW_READ)
  @ApiOperation({
    summary:
      'Credentials for the interview video room (participants only, needs an open session)',
  })
  async joinRoom(@GetMe('id') userId: string, @Param('id') id: string) {
    const result = await this.queryBus.execute(
      new GetRoomJoinInfoQuery(userId, id),
    );
    return ApiResponse.ok(result, 'Room credentials issued');
  }

  @Patch(':id/sessions/:sessionId/end')
  @RequirePermissions(Permission.INTERVIEW_READ)
  @ApiOperation({ summary: 'End a session (participants only)' })
  async endSession(
    @GetMe('id') userId: string,
    @Param('id') id: string,
    @Param('sessionId') sessionId: string,
  ) {
    const result = await this.commandBus.execute(
      new EndInterviewSessionCommand(userId, id, sessionId),
    );
    return ApiResponse.ok(result, 'Interview session ended');
  }

  @Get('application/:applicationId')
  @RequirePermissions(Permission.INTERVIEW_READ)
  @ApiOperation({
    summary:
      'List interviews for a job application (candidate or recruiter owner)',
  })
  async listByApplication(
    @GetMe('id') requesterId: string,
    @Param('applicationId') applicationId: string,
  ) {
    const result = await this.queryBus.execute(
      new ListInterviewsByApplicationQuery(requesterId, applicationId),
    );
    return ApiResponse.ok(result, 'Interviews retrieved successfully');
  }
}
