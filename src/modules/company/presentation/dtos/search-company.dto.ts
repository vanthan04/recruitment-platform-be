import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { PageOptionsDto } from '@/common/dtos/page-options.dto';

export class SearchCompanyDto extends PageOptionsDto {
  @ApiPropertyOptional({ example: 'Tech Corp' })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({ example: 'Information Technology' })
  @IsString()
  @IsOptional()
  industry?: string;
}
