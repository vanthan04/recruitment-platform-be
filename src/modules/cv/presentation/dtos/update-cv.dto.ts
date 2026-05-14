import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsArray,
  ValidateNested,
  MaxLength,
} from 'class-validator';

export class UpdateExperienceDto {
  @ApiPropertyOptional({ description: 'ID for existing experience (omit for new)' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiPropertyOptional({ example: 'Google' })
  @IsString()
  @MaxLength(200)
  company: string;

  @ApiPropertyOptional({ example: 'Senior Software Engineer' })
  @IsString()
  @MaxLength(200)
  position: string;

  @ApiPropertyOptional({ example: 'Built distributed systems at scale' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ example: '2020-01-15' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ example: '2023-06-30' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isCurrent?: boolean;
}

export class UpdateEducationDto {
  @ApiPropertyOptional({ description: 'ID for existing education (omit for new)' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiPropertyOptional({ example: 'MIT' })
  @IsString()
  @MaxLength(200)
  school: string;

  @ApiPropertyOptional({ example: 'Bachelor of Science' })
  @IsString()
  @MaxLength(200)
  degree: string;

  @ApiPropertyOptional({ example: 'Computer Science' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  fieldOfStudy?: string;

  @ApiPropertyOptional({ example: 'Focused on AI/ML research' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ example: '2016-09-01' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ example: '2020-06-15' })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class UpdateSkillDto {
  @ApiPropertyOptional({ description: 'ID for existing skill (omit for new)' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiPropertyOptional({ example: 'TypeScript' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Advanced' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  level?: string;
}

export class UpdateCvDto {
  @ApiPropertyOptional({ example: 'Updated CV Title' })
  @IsString()
  @IsOptional()
  @MaxLength(300)
  title?: string;

  @ApiPropertyOptional({ example: 'Updated summary...' })
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  summary?: string;

  @ApiPropertyOptional({ type: [UpdateExperienceDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateExperienceDto)
  experiences?: UpdateExperienceDto[];

  @ApiPropertyOptional({ type: [UpdateEducationDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateEducationDto)
  educations?: UpdateEducationDto[];

  @ApiPropertyOptional({ type: [UpdateSkillDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateSkillDto)
  skills?: UpdateSkillDto[];
}
