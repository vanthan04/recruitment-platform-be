import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/**
 * The only shape the AI provider's final answer is ever trusted through.
 * Populated exclusively via `plainToInstance` + `validate()` in
 * RecruitmentAgent — never by parsing free-form text. A model response that
 * fails this validation is rejected outright (InvalidAiOutputException),
 * never partially trusted.
 */
export class CandidateMatchSchema {
  @IsString()
  candidateId: string;

  @IsInt()
  @Min(0)
  @Max(100)
  score: number;

  @IsArray()
  @IsString({ each: true })
  matchedSkills: string[];

  @IsArray()
  @IsString({ each: true })
  missingSkills: string[];

  @IsString()
  @MaxLength(500)
  reason: string;
}

export class MatchingResultSchema {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CandidateMatchSchema)
  matches: CandidateMatchSchema[];
}

/** The agent's one terminal "tool" — calling it is how it submits a final answer instead of ending its turn with plain text. See RecruitmentAgent. */
export const SUBMIT_MATCHING_RESULT_TOOL_NAME = 'submit_matching_result';

export const submitMatchingResultToolDefinition = {
  name: SUBMIT_MATCHING_RESULT_TOOL_NAME,
  description:
    'Submit your final ranked candidate matches for this job. Call this exactly once, when you are done evaluating candidates.',
  inputSchema: {
    type: 'object',
    properties: {
      matches: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            candidateId: { type: 'string' },
            score: { type: 'integer', minimum: 0, maximum: 100 },
            matchedSkills: { type: 'array', items: { type: 'string' } },
            missingSkills: { type: 'array', items: { type: 'string' } },
            reason: { type: 'string' },
          },
          required: [
            'candidateId',
            'score',
            'matchedSkills',
            'missingSkills',
            'reason',
          ],
        },
      },
    },
    required: ['matches'],
  },
} as const;
