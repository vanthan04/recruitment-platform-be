import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

const MAX_PRIOR_TURNS = 20;

export class ScreeningTurnDto {
  @ApiProperty({ enum: ['user', 'assistant'] })
  @IsIn(['user', 'assistant'])
  role: 'user' | 'assistant';

  @ApiProperty()
  @IsString()
  @MaxLength(4000)
  content: string;
}

export class AskScreeningQuestionDto {
  @ApiProperty({ example: 'Does this candidate have Kubernetes experience?' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  question: string;

  @ApiPropertyOptional({
    description:
      'Prior turns of this same conversation, oldest first — the client resends history each call; nothing is persisted server-side.',
    type: [ScreeningTurnDto],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_PRIOR_TURNS)
  @ValidateNested({ each: true })
  @Type(() => ScreeningTurnDto)
  priorMessages?: ScreeningTurnDto[];
}
