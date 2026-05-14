import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsDateString,
  IsBoolean,
  IsArray,
  ValidateNested,
  MaxLength,
} from 'class-validator';

export class CreateExperienceDto {
  @ApiProperty({ example: 'Google' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  company: string;

  @ApiProperty({ example: 'Senior Software Engineer' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  position: string;

  @ApiPropertyOptional({ example: 'Built distributed systems at scale' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ example: '2020-01-15' })
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

export class CreateEducationDto {
  @ApiProperty({ example: 'MIT' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  school: string;

  @ApiProperty({ example: 'Bachelor of Science' })
  @IsString()
  @IsNotEmpty()
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

  @ApiProperty({ example: '2016-09-01' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ example: '2020-06-15' })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class CreateSkillDto {
  @ApiProperty({ example: 'TypeScript' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Advanced' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  level?: string;
}

export class CreateCvDto {
  @ApiProperty({ example: 'Senior Backend Developer CV' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  title: string;

  @ApiPropertyOptional({ example: 'Experienced engineer with 5+ years...' })
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  summary?: string;

  @ApiPropertyOptional({ type: [CreateExperienceDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateExperienceDto)
  experiences?: CreateExperienceDto[];

  @ApiPropertyOptional({ type: [CreateEducationDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateEducationDto)
  educations?: CreateEducationDto[];

  @ApiPropertyOptional({ type: [CreateSkillDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateSkillDto)
  skills?: CreateSkillDto[];
}
