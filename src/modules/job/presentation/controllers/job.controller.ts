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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/presentation/security/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { GetMe } from '@/common/decorators/get-me.decorator';
import { UserRole } from '@/common/enums/user-role.enum';
import { ApiResponse } from '@/common/dtos/api-response';

import { CreateJobUseCase } from '@/modules/job/application/use-cases/create-job.use-case';
import { UpdateJobUseCase } from '@/modules/job/application/use-cases/update-job.use-case';
import { ListJobsUseCase } from '@/modules/job/application/use-cases/list-jobs.use-case';
import { GetJobUseCase } from '@/modules/job/application/use-cases/get-job.use-case';
import { DeleteJobUseCase } from '@/modules/job/application/use-cases/delete-job.use-case';

import { CreateJobDto } from '@/modules/job/presentation/dtos/create-job.dto';
import { UpdateJobDto } from '@/modules/job/presentation/dtos/update-job.dto';
import { SearchJobDto } from '@/modules/job/presentation/dtos/search-job.dto';

@ApiTags('jobs')
@Controller('jobs')
export class JobController {
  constructor(
    private readonly createJobUseCase: CreateJobUseCase,
    private readonly updateJobUseCase: UpdateJobUseCase,
    private readonly listJobsUseCase: ListJobsUseCase,
    private readonly getJobUseCase: GetJobUseCase,
    private readonly deleteJobUseCase: DeleteJobUseCase,
  ) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER)
  @ApiOperation({ summary: 'Create a new job (Recruiter only)' })
  async create(@GetMe('id') recruiterId: string, @Body() dto: CreateJobDto) {
    const result = await this.createJobUseCase.execute(recruiterId, dto);
    return ApiResponse.ok(result, 'Job created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'List and search jobs' })
  async list(@Query() query: SearchJobDto) {
    const result = await this.listJobsUseCase.execute({
      page: query.page ?? 1,
      limit: query.limit ?? 10,
      keyword: query.keyword,
      location: query.location,
      jobType: query.jobType,
      salaryMin: query.salaryMin,
      salaryMax: query.salaryMax,
    });
    return ApiResponse.ok(result.jobs, 'Jobs retrieved successfully', {
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get job by ID' })
  async getById(@Param('id') id: string) {
    const result = await this.getJobUseCase.execute(id);
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
    const result = await this.updateJobUseCase.execute(recruiterId, jobId, dto);
    return ApiResponse.ok(result, 'Job updated successfully');
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete job (Recruiter owner only)' })
  async delete(@GetMe('id') recruiterId: string, @Param('id') jobId: string) {
    await this.deleteJobUseCase.execute(recruiterId, jobId);
  }
}
