import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterRequestDto {
  @IsEmail({}, { message: 'EMAIL_IS_INVALID' })
  @IsNotEmpty({ message: 'EMAIL_IS_REQUIRED' })
  email: string;

  @IsNotEmpty({ message: 'PASSWORD_IS_REQUIRED' })
  @MinLength(6, { message: 'PASSWORD_MIN_LENGTH' })
  password: string;

  @IsNotEmpty({ message: 'FULLNAME_IS_REQUIRED' })
  @IsString()
  fullName: string;
}
