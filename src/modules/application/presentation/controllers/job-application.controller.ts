import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/presentation/security/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { GetMe } from '@/common/decorators/get-me.decorator';
import { UserRole } from '@/common/enums/user-role.enum';
import { ApiResponse } from '@/common/dtos/api-response';

import { ApplyJobUseCase } from '@/modules/application/application/use-cases/apply-job.use-case';
import { UpdateApplicationStatusUseCase } from '@/modules/application/application/use-cases/update-application-status.use-case';
import { ListMyApplicationsUseCase } from '@/modules/application/application/use-cases/list-my-applications.use-case';
import { ListApplicationsByJobUseCase } from '@/modules/application/application/use-cases/list-applications-by-job.use-case';
import { WithdrawApplicationUseCase } from '@/modules/application/application/use-cases/withdraw-application.use-case';
import { GetJobStatsUseCase } from '@/modules/application/application/use-cases/get-job-stats.use-case';

import { ApplyJobDto } from '@/modules/application/presentation/dtos/apply-job.dto';
import { UpdateApplicationStatusDto } from '@/modules/application/presentation/dtos/update-application-status.dto';

@ApiTags('job-applications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('job-applications')
export class JobApplicationController {
  constructor(
    private readonly applyJobUseCase: ApplyJobUseCase,
    private readonly updateStatusUseCase: UpdateApplicationStatusUseCase,
    private readonly listMyAppsUseCase: ListMyApplicationsUseCase,
    private readonly listByJobUseCase: ListApplicationsByJobUseCase,
    private readonly withdrawApplicationUseCase: WithdrawApplicationUseCase,
    private readonly getJobStatsUseCase: GetJobStatsUseCase,
  ) {}

  @Post()
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: 'Apply for a job (Candidate only)' })
  async apply(@GetMe('id') userId: string, @Body() dto: ApplyJobDto) {
    const result = await this.applyJobUseCase.execute(userId, dto);
    return ApiResponse.ok(result, 'Application submitted successfully');
  }

  @Get('my-applications')
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: 'List my applications (Candidate only)' })
  async listMyApplications(@GetMe('id') userId: string) {
    const result = await this.listMyAppsUseCase.execute(userId);
    return ApiResponse.ok(result, 'Applications retrieved successfully');
  }

  @Get('job/:jobId')
  @Roles(UserRole.RECRUITER)
  @ApiOperation({ summary: 'List applications for a specific job (Recruiter owner only)' })
  async listByJob(@GetMe('id') recruiterId: string, @Param('jobId') jobId: string) {
    const result = await this.listByJobUseCase.execute(recruiterId, jobId);
    return ApiResponse.ok(result, 'Applications retrieved successfully');
  }

  @Get('job/:jobId/stats')
  @Roles(UserRole.RECRUITER)
  @ApiOperation({ summary: 'Get application stats + view count for a job (Recruiter owner only)' })
  async getJobStats(@GetMe('id') recruiterId: string, @Param('jobId') jobId: string) {
    const result = await this.getJobStatsUseCase.execute(recruiterId, jobId);
    return ApiResponse.ok(result, 'Job stats retrieved successfully');
  }

  @Patch(':id/withdraw')
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: 'Withdraw a pending application (Candidate owner only)' })
  async withdraw(@GetMe('id') userId: string, @Param('id') id: string) {
    const result = await this.withdrawApplicationUseCase.execute(userId, id);
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
    const result = await this.updateStatusUseCase.execute(recruiterId, id, dto.status);
    return ApiResponse.ok(result, 'Application status updated successfully');
  }
}
