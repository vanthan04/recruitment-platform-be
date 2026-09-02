import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/presentation/security/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { GetMe } from '@/common/decorators/get-me.decorator';
import { UserRole } from '@/common/enums/user-role.enum';
import { ApiResponse } from '@/common/dtos/api-response';

import { CreateJobCommand } from '@/modules/job/application/commands/create-job.command';
import { UpdateJobCommand } from '@/modules/job/application/commands/update-job.command';
import { DeleteJobCommand } from '@/modules/job/application/commands/delete-job.command';
import { CloseJobCommand } from '@/modules/job/application/commands/close-job.command';
import { ReopenJobCommand } from '@/modules/job/application/commands/reopen-job.command';
import { GetJobQuery } from '@/modules/job/application/queries/get-job.query';
import { ListJobsQuery } from '@/modules/job/application/queries/list-jobs.query';

import { CreateJobDto } from '@/modules/job/presentation/dtos/create-job.dto';
import { UpdateJobDto } from '@/modules/job/presentation/dtos/update-job.dto';
import { SearchJobDto } from '@/modules/job/presentation/dtos/search-job.dto';

@ApiTags('jobs')
@Controller('jobs')
export class JobController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER)
  @ApiOperation({ summary: 'Create a new job (Recruiter only)' })
  async create(@GetMe('id') recruiterId: string, @Body() dto: CreateJobDto) {
    const result = await this.commandBus.execute(new CreateJobCommand(recruiterId, dto));
    return ApiResponse.ok(result, 'Job created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'List and search jobs' })
  async list(@Query() query: SearchJobDto) {
    const result = await this.queryBus.execute(
      new ListJobsQuery({
        page: query.page ?? 1,
        limit: query.limit ?? 10,
        keyword: query.keyword,
        location: query.location,
        jobType: query.jobType,
        salaryMin: query.salaryMin,
        salaryMax: query.salaryMax,
        companyId: query.companyId,
        categoryId: query.categoryId,
        level: query.level,
      }),
    );
    return ApiResponse.ok(result.jobs, 'Jobs retrieved successfully', {
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get job by ID' })
  async getById(@Param('id') id: string) {
    const result = await this.queryBus.execute(new GetJobQuery(id));
    return ApiResponse.ok(result, 'Job retrieved successfully');
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER)
  @ApiOperation({ summary: 'Update job (Recruiter owner only)' })
  async update(
    @GetMe('id') recruiterId: string,
    @Param('id') jobId: string,
    @Body() dto: UpdateJobDto,
  ) {
    const result = await this.commandBus.execute(new UpdateJobCommand(recruiterId, jobId, dto));
    return ApiResponse.ok(result, 'Job updated successfully');
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete job (Recruiter owner only)' })
  async delete(@GetMe('id') recruiterId: string, @Param('id') jobId: string) {
    await this.commandBus.execute(new DeleteJobCommand(recruiterId, jobId));
  }

  @Patch(':id/close')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER)
  @ApiOperation({ summary: 'Close job, stop accepting applications (Recruiter owner only)' })
  async close(@GetMe('id') recruiterId: string, @Param('id') jobId: string) {
    const result = await this.commandBus.execute(new CloseJobCommand(recruiterId, jobId));
    return ApiResponse.ok(result, 'Job closed successfully');
  }

  @Patch(':id/reopen')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER)
  @ApiOperation({ summary: 'Reopen a closed job (Recruiter owner only)' })
  async reopen(@GetMe('id') recruiterId: string, @Param('id') jobId: string) {
    const result = await this.commandBus.execute(new ReopenJobCommand(recruiterId, jobId));
    return ApiResponse.ok(result, 'Job reopened successfully');
  }
}
