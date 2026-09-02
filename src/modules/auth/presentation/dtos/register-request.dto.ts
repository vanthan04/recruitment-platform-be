import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsEnum,
} from 'class-validator';
import { UserRole } from '@/common/enums/user-role.enum';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterRequestDto {
  @ApiProperty({ example: 'test@example.com' })
  @IsEmail({}, { message: 'EMAIL_IS_INVALID' })
  @IsNotEmpty({ message: 'EMAIL_IS_REQUIRED' })
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsNotEmpty({ message: 'PASSWORD_IS_REQUIRED' })
  @MinLength(6, { message: 'PASSWORD_MIN_LENGTH' })
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty({ message: 'FULLNAME_IS_REQUIRED' })
  @IsString()
  fullName: string;

  @ApiProperty({ enum: UserRole, example: UserRole.CANDIDATE })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;
}
