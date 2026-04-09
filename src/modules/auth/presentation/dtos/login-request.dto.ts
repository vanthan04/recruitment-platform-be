import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class LoginRequestDto {
  @IsEmail({}, { message: 'EMAIL_IS_INVALID' })
  @IsNotEmpty({ message: 'EMAIL_IS_REQUIRED' })
  email: string;

  @IsNotEmpty({ message: 'PASSWORD_IS_REQUIRED' })
  password: string;
}
