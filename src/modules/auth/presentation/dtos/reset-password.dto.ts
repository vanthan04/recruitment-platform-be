import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'ABCDEF',
    description: 'Verification code sent by email',
  })
  @IsString()
  @IsNotEmpty({ message: 'Verification code must not be empty' })
  code: string;

  @ApiProperty({ example: 'NewPassword123!', description: 'New password' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  @IsNotEmpty({ message: 'Password must not be empty' })
  newPassword: string;
}
