import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsPhoneNumber,
  IsUrl,
} from 'class-validator';
import { Gender } from '@/common/enums/gender.enum';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Nguyễn Văn A' })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ example: '0123456789' })
  @IsPhoneNumber('VN')
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional({ enum: Gender, example: Gender.MALE })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiPropertyOptional({ example: '1990-01-01' })
  @IsDateString()
  @IsOptional()
  birthDate?: string;

  @ApiPropertyOptional({
    example: 'https://bucket.s3.amazonaws.com/avatars/xxx.jpg',
    description:
      'URL returned by POST /files/upload?folder=avatars — arbitrary external URLs are rejected (see update-profile.command.ts).',
  })
  @IsUrl()
  @IsOptional()
  avatarUrl?: string;
}
