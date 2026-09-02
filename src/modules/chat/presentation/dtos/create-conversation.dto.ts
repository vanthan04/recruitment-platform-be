import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateConversationDto {
  @ApiProperty({ example: 'uuid-of-application' })
  @IsUUID()
  @IsNotEmpty()
  applicationId: string;
}
