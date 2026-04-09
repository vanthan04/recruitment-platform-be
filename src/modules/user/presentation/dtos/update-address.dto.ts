import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateAddressDto {
  @ApiPropertyOptional({ example: 'Thành phố Hồ Chí Minh' })
  @IsString()
  @IsOptional()
  province?: string;

  @ApiPropertyOptional({ example: 'Quận 1' })
  @IsString()
  @IsOptional()
  ward?: string;

  @ApiPropertyOptional({ example: 'Phường Bến Nghé' })
  @IsString()
  @IsOptional()
  hamlet?: string;

  @ApiPropertyOptional({ example: '123 Đường Lê Lợi' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
