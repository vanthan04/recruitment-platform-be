import { ApiProperty } from '@nestjs/swagger';

export class CandidateMatchResponseDto {
  @ApiProperty({ description: "The matched candidate's user id" })
  candidateId: string;

  @ApiProperty({
    description: 'Overall fit score, 0-100',
    minimum: 0,
    maximum: 100,
  })
  score: number;

  @ApiProperty({ type: [String] })
  matchedSkills: string[];

  @ApiProperty({ type: [String] })
  missingSkills: string[];

  @ApiProperty({
    description: 'Concise (1-2 sentence) explanation of the score',
  })
  reason: string;
}

export class MatchingCandidatesResponseDto {
  @ApiProperty()
  jobId: string;

  @ApiProperty({ type: [CandidateMatchResponseDto] })
  matches: CandidateMatchResponseDto[];
}
