import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
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
