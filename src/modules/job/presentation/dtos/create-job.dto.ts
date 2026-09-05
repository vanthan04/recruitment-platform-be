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
  IsArray,
  IsUUID,
} from 'class-validator';
import { EmploymentType } from '@/modules/job/domain/value-objects/employment-type.vo';
import { WorkMode } from '@/modules/job/domain/value-objects/work-mode.vo';
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

  @ApiProperty({ enum: EmploymentType, default: EmploymentType.FULL_TIME })
  @IsEnum(EmploymentType)
  @IsOptional()
  employmentType?: EmploymentType = EmploymentType.FULL_TIME;

  @ApiProperty({ enum: WorkMode, default: WorkMode.ONSITE })
  @IsEnum(WorkMode)
  @IsOptional()
  workMode?: WorkMode = WorkMode.ONSITE;

  @ApiPropertyOptional({ enum: JobLevel })
  @IsEnum(JobLevel)
  @IsOptional()
  level?: JobLevel;

  @ApiPropertyOptional({ example: 'c1a2b3c4-...' })
  @IsUUID()
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

  @ApiPropertyOptional({ example: 'Thứ 2 - Thứ 6 (08:00 - 17:00)' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  workingHours?: string;

  @ApiPropertyOptional({ example: 'Ứng tuyển trực tuyến qua nút bên dưới.' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  applicationMethod?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @ApiPropertyOptional({
    description: 'Skill ids to attach to this job (must already exist).',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skillIds?: string[];
}
