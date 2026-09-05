import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  IsArray,
} from 'class-validator';
import { EmploymentType } from '@/modules/job/domain/value-objects/employment-type.vo';
import { WorkMode } from '@/modules/job/domain/value-objects/work-mode.vo';
import { JobLevel } from '@/modules/job/domain/value-objects/job-level.vo';
import { JobSortOption } from '@/modules/job/domain/value-objects/job-sort-option.vo';
import { PageOptionsDto } from '@/common/dtos/page-options.dto';
import { Type, Transform } from 'class-transformer';

export class SearchJobDto extends PageOptionsDto {
  @ApiPropertyOptional({ example: 'Node.js' })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({ example: 'Ho Chi Minh' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ enum: EmploymentType })
  @IsEnum(EmploymentType)
  @IsOptional()
  employmentType?: EmploymentType;

  @ApiPropertyOptional({ enum: WorkMode })
  @IsEnum(WorkMode)
  @IsOptional()
  workMode?: WorkMode;

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

  @ApiPropertyOptional({ example: 'c1a2b3c4-...' })
  @IsString()
  @IsOptional()
  companyId?: string;

  @ApiPropertyOptional({ example: 'c1a2b3c4-...' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ enum: JobLevel })
  @IsEnum(JobLevel)
  @IsOptional()
  level?: JobLevel;

  @ApiPropertyOptional({ enum: JobSortOption, default: JobSortOption.NEWEST })
  @IsEnum(JobSortOption)
  @IsOptional()
  sort?: JobSortOption;

  @ApiPropertyOptional({
    type: [String],
    description:
      'Filter to jobs having at least one of these skill ids (comma-separated or repeated query param).',
  })
  @Transform(({ value }: { value: unknown }): unknown =>
    Array.isArray(value)
      ? value
      : typeof value === 'string'
        ? value.split(',').filter(Boolean)
        : value,
  )
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skillIds?: string[];
}
