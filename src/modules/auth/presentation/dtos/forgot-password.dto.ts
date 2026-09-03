import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email of the account to reset the password for',
  })
  @IsEmail({}, { message: 'Invalid email' })
  @IsNotEmpty({ message: 'Email must not be empty' })
  email: string;
}
