import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApplicationStatus } from '@/modules/application/domain/value-objects/application-status.vo';

export class UpdateApplicationStatusDto {
  @ApiProperty({ enum: ApplicationStatus })
  @IsEnum(ApplicationStatus)
  @IsNotEmpty()
  status: ApplicationStatus;

  @ApiPropertyOptional({
    example: 'Strong technical interview, moving to offer stage',
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  note?: string;
}
