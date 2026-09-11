import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsEnum,
  IsIn,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '@/common/enums/user-role.enum';
import {
  IsStrongPassword,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
} from '@/common/validators/password-strength.validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterRequestDto {
  @ApiProperty({ example: 'test@example.com' })
  @IsEmail({}, { message: 'EMAIL_IS_INVALID' })
  @IsNotEmpty({ message: 'EMAIL_IS_REQUIRED' })
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsNotEmpty({ message: 'PASSWORD_IS_REQUIRED' })
  @MinLength(PASSWORD_MIN_LENGTH, { message: 'PASSWORD_MIN_LENGTH' })
  @MaxLength(PASSWORD_MAX_LENGTH, { message: 'PASSWORD_TOO_LONG' })
  @IsStrongPassword()
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty({ message: 'FULLNAME_IS_REQUIRED' })
  @IsString()
  fullName: string;

  @ApiProperty({
    enum: [UserRole.CANDIDATE, UserRole.RECRUITER],
    example: UserRole.CANDIDATE,
  })
  @IsEnum(UserRole)
  @IsIn([UserRole.CANDIDATE, UserRole.RECRUITER], {
    message: 'Public registration only supports CANDIDATE or RECRUITER',
  })
  @IsNotEmpty()
  role: UserRole;
}
