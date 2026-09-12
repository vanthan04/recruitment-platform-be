import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class SuggestJobSkillsDto {
  @ApiPropertyOptional({ example: 'Senior Backend Developer' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @ApiProperty({
    example:
      'We are looking for a backend developer experienced with NestJS, PostgreSQL, and Docker...',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description: string;
}
