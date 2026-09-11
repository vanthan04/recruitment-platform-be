import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import {
  IsStrongPassword,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
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
  @MaxLength(PASSWORD_MAX_LENGTH, { message: 'PASSWORD_TOO_LONG' })
  @IsStrongPassword()
  @IsNotEmpty({ message: 'Password must not be empty' })
  newPassword: string;
}
