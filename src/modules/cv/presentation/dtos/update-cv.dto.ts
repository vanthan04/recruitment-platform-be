import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateCvDto {
  @ApiPropertyOptional({ example: 'Updated CV Title' })
  @IsString()
  @IsOptional()
  @MaxLength(300)
  title?: string;
}
