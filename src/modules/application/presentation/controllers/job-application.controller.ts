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

import { ApplyJobCommand } from '@/modules/application/application/commands/apply-job.command';
import { UpdateApplicationStatusCommand } from '@/modules/application/application/commands/update-application-status.command';
import { WithdrawApplicationCommand } from '@/modules/application/application/commands/withdraw-application.command';
import { ListMyApplicationsQuery } from '@/modules/application/application/queries/list-my-applications.query';
import { ListApplicationsByJobQuery } from '@/modules/application/application/queries/list-applications-by-job.query';
import { GetJobStatsQuery } from '@/modules/application/application/queries/get-job-stats.query';

import { ApplyJobDto } from '@/modules/application/presentation/dtos/apply-job.dto';
import { UpdateApplicationStatusDto } from '@/modules/application/presentation/dtos/update-application-status.dto';

@ApiTags('job-applications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('job-applications')
export class JobApplicationController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: 'Apply for a job (Candidate only)' })
  async apply(@GetMe('id') userId: string, @Body() dto: ApplyJobDto) {
    const result = await this.commandBus.execute(
      new ApplyJobCommand(userId, dto),
    );
    return ApiResponse.ok(result, 'Application submitted successfully');
  }

  @Get('my-applications')
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: 'List my applications (Candidate only)' })
  async listMyApplications(@GetMe('id') userId: string) {
    const result = await this.queryBus.execute(
      new ListMyApplicationsQuery(userId),
    );
    return ApiResponse.ok(result, 'Applications retrieved successfully');
  }

  @Get('job/:jobId')
  @Roles(UserRole.RECRUITER)
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
  @Roles(UserRole.RECRUITER)
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

  @Patch(':id/withdraw')
  @Roles(UserRole.CANDIDATE)
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
  @Roles(UserRole.RECRUITER)
  @ApiOperation({ summary: 'Update application status (Recruiter owner only)' })
  async updateStatus(
    @GetMe('id') recruiterId: string,
    @Param('id') id: string,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    const result = await this.commandBus.execute(
      new UpdateApplicationStatusCommand(recruiterId, id, dto.status),
    );
    return ApiResponse.ok(result, 'Application status updated successfully');
  }
}
