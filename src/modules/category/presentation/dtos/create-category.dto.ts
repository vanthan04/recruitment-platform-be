import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Information Technology' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;
}
