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

  @ApiPropertyOptional({ example: '520 CMT8 Street, Ward 11, District 3' })
  @IsString()
  @IsOptional()
  @MaxLength(300)
  address?: string;

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

  @ApiPropertyOptional({
    description: 'One bullet point per array element.',
    type: [String],
    example: [
      '2+ years of experience with Node.js',
      "Bachelor's degree or above",
    ],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  requirements?: string[];

  @ApiPropertyOptional({
    description: 'One bullet point per array element.',
    type: [String],
    example: ['Social insurance', 'Annual health checkup'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  benefits?: string[];

  @ApiPropertyOptional({
    description: 'One bullet point per array element.',
    type: [String],
    example: ['Mon - Fri (08:00 - 17:00)', 'Lunch break 12:00 - 13:00'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  workingHours?: string[];

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
