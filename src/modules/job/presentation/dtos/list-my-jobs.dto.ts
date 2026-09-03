import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { JobStatus } from '@/modules/job/domain/value-objects/job-status.vo';
import { PageOptionsDto } from '@/common/dtos/page-options.dto';

export class ListMyJobsDto extends PageOptionsDto {
  @ApiPropertyOptional({ enum: JobStatus })
  @IsEnum(JobStatus)
  @IsOptional()
  status?: JobStatus;
}
