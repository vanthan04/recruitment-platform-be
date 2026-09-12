import { ApiProperty } from '@nestjs/swagger';

export class ScreeningAnswerResponseDto {
  @ApiProperty()
  jobId: string;

  @ApiProperty()
  candidateId: string;

  @ApiProperty()
  answer: string;
}
