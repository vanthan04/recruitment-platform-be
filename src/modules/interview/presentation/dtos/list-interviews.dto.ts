import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { PageOptionsDto } from '@/common/dtos/page-options.dto';
import { InterviewStatus } from '@/modules/interview/domain/value-objects/interview-status.vo';

export class ListInterviewsDto extends PageOptionsDto {
  @ApiPropertyOptional({ enum: InterviewStatus })
  @IsOptional()
  @IsEnum(InterviewStatus)
  readonly status?: InterviewStatus;

  @ApiPropertyOptional({
    description:
      'Only pending (SCHEDULED/RESCHEDULED) interviews that have not started yet, soonest first',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  readonly upcoming?: boolean;
}
