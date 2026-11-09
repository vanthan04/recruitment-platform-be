import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PageOptionsDto } from '@/common/dtos/page-options.dto';
import { MONITORING_EVENT_TYPES } from '@/modules/monitoring/domain/services/event-rules';
import type { MonitoringEventType } from '@/modules/monitoring/domain/services/event-rules';

export class ListDetectionEventsDto extends PageOptionsDto {
  @ApiPropertyOptional({ enum: MONITORING_EVENT_TYPES })
  @IsOptional()
  @IsIn(MONITORING_EVENT_TYPES)
  readonly eventType?: MonitoringEventType;

  @ApiPropertyOptional({ description: 'Only events of this interview session' })
  @IsOptional()
  @IsUUID()
  readonly sessionId?: string;

  @ApiPropertyOptional({
    description: 'true = reviewed only, false = not yet reviewed',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  readonly reviewed?: boolean;
}

export class ReviewDetectionEventDto {
  @ApiPropertyOptional({
    description: "Recruiter's private note",
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  readonly note?: string;
}
