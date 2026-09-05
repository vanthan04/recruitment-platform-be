import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { CompanySize } from '@/modules/company/domain/value-objects/company-size.vo';
import { CompanyType } from '@/modules/company/domain/value-objects/company-type.vo';

export class CreateCompanyDto {
  @ApiProperty({ example: 'Tech Corp' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/logo.png' })
  @IsUrl()
  @IsOptional()
  logoUrl?: string;

  @ApiPropertyOptional({ example: 'We build great software.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'https://techcorp.com' })
  @IsUrl()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({ enum: CompanySize })
  @IsEnum(CompanySize)
  @IsOptional()
  size?: CompanySize;

  @ApiPropertyOptional({ enum: CompanyType })
  @IsEnum(CompanyType)
  @IsOptional()
  companyType?: CompanyType;

  @ApiPropertyOptional({ example: 'Ho Chi Minh City' })
  @IsString()
  @IsOptional()
  @MaxLength(300)
  address?: string;

  @ApiPropertyOptional({ example: 'Ho Chi Minh City' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  province?: string;

  @ApiPropertyOptional({ example: 'Ben Nghe Ward' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  ward?: string;
}
