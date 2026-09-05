import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import {
  IsStrongPassword,
  PASSWORD_MIN_LENGTH,
} from '@/common/validators/password-strength.validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPassword123!', description: 'Current password' })
  @IsString()
  @IsNotEmpty({ message: 'Old password must not be empty' })
  oldPassword: string;

  @ApiProperty({ example: 'NewPassword123!', description: 'New password' })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH, {
    message: `New password must be at least ${PASSWORD_MIN_LENGTH} characters`,
  })
  @IsStrongPassword()
  @IsNotEmpty({ message: 'New password must not be empty' })
  newPassword: string;
}
