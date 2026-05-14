import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
} from 'class-validator';
import { JobType } from '@/modules/job/domain/value-objects/job-type.vo';
import { PageOptionsDto } from '@/common/dtos/page-options.dto';
import { Type } from 'class-transformer';

export class SearchJobDto extends PageOptionsDto {
  @ApiPropertyOptional({ example: 'Node.js' })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({ example: 'Ho Chi Minh' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ enum: JobType })
  @IsEnum(JobType)
  @IsOptional()
  jobType?: JobType;

  @ApiPropertyOptional({ example: 1000 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  salaryMin?: number;

  @ApiPropertyOptional({ example: 5000 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  salaryMax?: number;
}
