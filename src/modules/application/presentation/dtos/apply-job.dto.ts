import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class ApplyJobDto {
  @ApiProperty({ example: 'uuid-of-job' })
  @IsUUID()
  @IsNotEmpty()
  jobId: string;

  @ApiProperty({ example: 'uuid-of-cv' })
  @IsUUID()
  @IsNotEmpty()
  cvId: string;

  @ApiPropertyOptional({ example: 'I am very interested in this position...' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  coverLetter?: string;
}
