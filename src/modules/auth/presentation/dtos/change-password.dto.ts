import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPassword123!', description: 'Current password' })
  @IsString()
  @IsNotEmpty({ message: 'Old password must not be empty' })
  oldPassword: string;

  @ApiProperty({ example: 'NewPassword123!', description: 'New password' })
  @IsString()
  @MinLength(6, { message: 'New password must be at least 6 characters' })
  @IsNotEmpty({ message: 'New password must not be empty' })
  newPassword: string;
}
