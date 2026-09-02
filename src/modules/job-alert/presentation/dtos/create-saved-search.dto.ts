import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { JobType } from '@/modules/job/domain/value-objects/job-type.vo';

export class CreateSavedSearchDto {
  @ApiPropertyOptional({ example: 'Node.js' })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({ example: 'Ho Chi Minh' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ example: 'c1a2b3c4-...' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ enum: JobType })
  @IsEnum(JobType)
  @IsOptional()
  jobType?: JobType;
}
