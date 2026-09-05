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

import { ApplyJobCommand } from '@/modules/application/application/commands/apply-job.command';
import { UpdateApplicationStatusCommand } from '@/modules/application/application/commands/update-application-status.command';
import { WithdrawApplicationCommand } from '@/modules/application/application/commands/withdraw-application.command';
import { ListMyApplicationsQuery } from '@/modules/application/application/queries/list-my-applications.query';
import { ListApplicationsByJobQuery } from '@/modules/application/application/queries/list-applications-by-job.query';
import { GetJobStatsQuery } from '@/modules/application/application/queries/get-job-stats.query';
import { GetApplicationStatusHistoryQuery } from '@/modules/application/application/queries/get-application-status-history.query';

import { ApplyJobDto } from '@/modules/application/presentation/dtos/apply-job.dto';
import { UpdateApplicationStatusDto } from '@/modules/application/presentation/dtos/update-application-status.dto';

@ApiTags('job-applications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('job-applications')
export class JobApplicationController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @RequirePermissions(Permission.APPLICATION_CREATE)
  @ApiOperation({ summary: 'Apply for a job (Candidate only)' })
  async apply(@GetMe('id') userId: string, @Body() dto: ApplyJobDto) {
    const result = await this.commandBus.execute(
      new ApplyJobCommand(userId, dto),
    );
    return ApiResponse.ok(result, 'Application submitted successfully');
  }

  @Get('my-applications')
  @RequirePermissions(Permission.APPLICATION_READ_OWN)
  @ApiOperation({ summary: 'List my applications (Candidate only)' })
  async listMyApplications(@GetMe('id') userId: string) {
    const result = await this.queryBus.execute(
      new ListMyApplicationsQuery(userId),
    );
    return ApiResponse.ok(result, 'Applications retrieved successfully');
  }

  @Get('job/:jobId')
  @RequirePermissions(Permission.APPLICATION_READ)
  @ApiOperation({
    summary: 'List applications for a specific job (Recruiter owner only)',
  })
  async listByJob(
    @GetMe('id') recruiterId: string,
    @Param('jobId') jobId: string,
  ) {
    const result = await this.queryBus.execute(
      new ListApplicationsByJobQuery(recruiterId, jobId),
    );
    return ApiResponse.ok(result, 'Applications retrieved successfully');
  }

  @Get('job/:jobId/stats')
  @RequirePermissions(Permission.APPLICATION_READ)
  @ApiOperation({
    summary:
      'Get application stats + view count for a job (Recruiter owner only)',
  })
  async getJobStats(
    @GetMe('id') recruiterId: string,
    @Param('jobId') jobId: string,
  ) {
    const result = await this.queryBus.execute(
      new GetJobStatsQuery(recruiterId, jobId),
    );
    return ApiResponse.ok(result, 'Job stats retrieved successfully');
  }

  @Get(':id/history')
  // Both roles can call this: gated on APPLICATION_READ_OWN (not
  // APPLICATION_READ, which is recruiter-only "read applications for jobs I
  // own") because the handler itself allows either the candidate who owns
  // the application or the recruiter who owns the job — RECRUITER is granted
  // APPLICATION_READ_OWN too (see prisma/seed.ts) specifically for this route.
  @RequirePermissions(Permission.APPLICATION_READ_OWN)
  @ApiOperation({
    summary:
      'View the status change history of an application (Candidate owner or Recruiter owner only)',
  })
  async getStatusHistory(
    @GetMe('id') requesterId: string,
    @Param('id') id: string,
  ) {
    const result = await this.queryBus.execute(
      new GetApplicationStatusHistoryQuery(requesterId, id),
    );
    return ApiResponse.ok(
      result,
      'Application status history retrieved successfully',
    );
  }

  @Patch(':id/withdraw')
  @RequirePermissions(Permission.APPLICATION_WITHDRAW_OWN)
  @ApiOperation({
    summary: 'Withdraw a pending application (Candidate owner only)',
  })
  async withdraw(@GetMe('id') userId: string, @Param('id') id: string) {
    const result = await this.commandBus.execute(
      new WithdrawApplicationCommand(userId, id),
    );
    return ApiResponse.ok(result, 'Application withdrawn successfully');
  }

  @Patch(':id/status')
  @RequirePermissions(Permission.APPLICATION_UPDATE)
  @ApiOperation({ summary: 'Update application status (Recruiter owner only)' })
  async updateStatus(
    @GetMe('id') recruiterId: string,
    @Param('id') id: string,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    const result = await this.commandBus.execute(
      new UpdateApplicationStatusCommand(recruiterId, id, dto.status, dto.note),
    );
    return ApiResponse.ok(result, 'Application status updated successfully');
  }
}
