import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({ example: 'ABCDEF', description: 'Mã xác thực gửi qua email' })
  @IsString()
  @IsNotEmpty({ message: 'Mã xác thực không được để trống' })
  code: string;
}
