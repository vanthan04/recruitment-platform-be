import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class DraftJobDto {
  @ApiProperty({
    example:
      'Senior NestJS backend developer, 3+ years, Ho Chi Minh City, remote-friendly, needs PostgreSQL and Docker experience',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  hints: string;
}
