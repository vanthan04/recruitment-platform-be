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
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { GetMe } from '@/common/decorators/get-me.decorator';
import { UserRole } from '@/common/enums/user-role.enum';
import { ApiResponse } from '@/common/dtos/api-response';

import { ScheduleInterviewCommand } from '@/modules/interview/application/commands/schedule-interview.command';
import { RescheduleInterviewCommand } from '@/modules/interview/application/commands/reschedule-interview.command';
import { CancelInterviewCommand } from '@/modules/interview/application/commands/cancel-interview.command';
import { ListInterviewsByApplicationQuery } from '@/modules/interview/application/queries/list-interviews-by-application.query';

import { ScheduleInterviewDto } from '@/modules/interview/presentation/dtos/schedule-interview.dto';
import { RescheduleInterviewDto } from '@/modules/interview/presentation/dtos/reschedule-interview.dto';

@ApiTags('interviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('interviews')
export class InterviewController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @Roles(UserRole.RECRUITER)
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
  @Roles(UserRole.RECRUITER)
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
  @Roles(UserRole.RECRUITER)
  @ApiOperation({ summary: 'Cancel an interview (Recruiter owner only)' })
  async cancel(@GetMe('id') recruiterId: string, @Param('id') id: string) {
    const result = await this.commandBus.execute(
      new CancelInterviewCommand(recruiterId, id),
    );
    return ApiResponse.ok(result, 'Interview cancelled successfully');
  }

  @Get('application/:applicationId')
  @Roles(UserRole.CANDIDATE, UserRole.RECRUITER)
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
