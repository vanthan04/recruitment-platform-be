import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsDateString,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';

export class ScheduleInterviewDto {
  @ApiProperty({ example: 'uuid-of-job-application' })
  @IsUUID()
  @IsNotEmpty()
  jobApplicationId: string;

  @ApiProperty({ example: '2026-09-10T09:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  scheduledAt: string;

  @ApiPropertyOptional({ example: '123 Nguyen Van Cu, Q5, TP.HCM' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  location?: string;

  @ApiPropertyOptional({ example: 'https://meet.google.com/abc-defg-hij' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  meetingLink?: string;

  @ApiPropertyOptional({ example: 'Mang theo CV bản in' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  note?: string;

  @ApiPropertyOptional({ example: 45 })
  @IsInt()
  @Min(1)
  @IsOptional()
  durationMinutes?: number;
}
