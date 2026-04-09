import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({ example: 'Thành phố Hồ Chí Minh' })
  @IsString()
  @IsNotEmpty()
  province: string;

  @ApiProperty({ example: 'Quận 1' })
  @IsString()
  @IsNotEmpty()
  ward: string;

  @ApiProperty({ example: 'Phường Bến Nghé' })
  @IsString()
  @IsNotEmpty()
  hamlet: string;

  @ApiProperty({ example: '123 Đường Lê Lợi' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
