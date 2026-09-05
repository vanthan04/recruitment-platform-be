import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import {
  IsStrongPassword,
  PASSWORD_MIN_LENGTH,
} from '@/common/validators/password-strength.validator';

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
  @MinLength(PASSWORD_MIN_LENGTH, {
    message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
  })
  @IsStrongPassword()
  @IsNotEmpty({ message: 'Password must not be empty' })
  newPassword: string;
}
