import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'ABCDEF', description: 'Mã xác thực gửi qua email' })
  @IsString()
  @IsNotEmpty({ message: 'Mã xác thực không được để trống' })
  code: string;

  @ApiProperty({ example: 'NewPassword123!', description: 'Mật khẩu mới' })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  newPassword: string;
}
