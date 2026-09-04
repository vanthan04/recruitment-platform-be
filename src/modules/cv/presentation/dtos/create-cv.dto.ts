import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

/**
 * multipart/form-data body for `POST /cvs` — the file itself arrives as a
 * separate Multer-parsed part, not through this DTO.
 */
export class CreateCvDto {
  @ApiProperty({ example: 'Backend Developer CV' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  title: string;
}
