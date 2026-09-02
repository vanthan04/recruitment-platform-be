import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { JobType } from '@/modules/job/domain/value-objects/job-type.vo';
import { JobLevel } from '@/modules/job/domain/value-objects/job-level.vo';

export class CreateJobDto {
  @ApiProperty({ example: 'Senior Node.js Developer' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'Full job description here...' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'Ho Chi Minh City' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  location: string;

  @ApiProperty({ enum: JobType, default: JobType.FULL_TIME })
  @IsEnum(JobType)
  @IsOptional()
  jobType?: JobType = JobType.FULL_TIME;

  @ApiPropertyOptional({ enum: JobLevel })
  @IsEnum(JobLevel)
  @IsOptional()
  level?: JobLevel;

  @ApiPropertyOptional({ example: 'c1a2b3c4-...' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ example: 1000 })
  @IsInt()
  @Min(0)
  @IsOptional()
  salaryMin?: number;

  @ApiPropertyOptional({ example: 3000 })
  @IsInt()
  @Min(0)
  @IsOptional()
  salaryMax?: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string = 'VND';

  @ApiPropertyOptional({ example: 'Requirements list...' })
  @IsString()
  @IsOptional()
  requirements?: string;

  @ApiPropertyOptional({ example: 'Benefits list...' })
  @IsString()
  @IsOptional()
  benefits?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
