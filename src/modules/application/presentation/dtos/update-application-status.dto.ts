import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApplicationStatus } from '@/modules/application/domain/value-objects/application-status.vo';

export class UpdateApplicationStatusDto {
  @ApiProperty({ enum: ApplicationStatus })
  @IsEnum(ApplicationStatus)
  @IsNotEmpty()
  status: ApplicationStatus;
}
