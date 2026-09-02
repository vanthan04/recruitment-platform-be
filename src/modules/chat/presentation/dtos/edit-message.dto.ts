import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class EditMessageDto {
  @ApiProperty({ example: 'Hi, thanks for accepting my application! (edited)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string;
}
