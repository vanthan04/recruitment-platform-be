import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsString,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';

export class RescheduleInterviewDto {
  @ApiPropertyOptional({ example: '2026-09-12T09:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

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

  @ApiPropertyOptional({
    description: "Hold the interview in the platform's own video room",
  })
  @IsBoolean()
  @IsOptional()
  useRoom?: boolean;

  @ApiPropertyOptional({ example: 'Đổi sang phỏng vấn online' })
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
