import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    example: 'ABCDEF',
    description: 'Verification code sent by email',
  })
  @IsString()
  @IsNotEmpty({ message: 'Verification code must not be empty' })
  code: string;
}
