import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SocialExchangeDto {
  @ApiProperty({
    description: 'One-time code from the /auth/callback redirect',
  })
  @IsNotEmpty()
  @IsString()
  code: string;
}
