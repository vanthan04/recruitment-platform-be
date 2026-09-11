import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * The only shape a single-shot CV-analysis extraction call is ever trusted
 * through — see CvAnalysisService. Same "schema-validate, never freeform
 * parse" rule as MatchingResultSchema.
 */
export class CvAnalysisExtractionSchema {
  @IsString()
  @MaxLength(1000)
  summary: string;

  @IsArray()
  @IsString({ each: true })
  skills: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(60)
  experienceYears: number | null;

  @IsArray()
  @IsString({ each: true })
  education: string[];
}

export const EXTRACT_CV_ANALYSIS_TOOL_NAME = 'extract_cv_analysis';

export const extractCvAnalysisToolDefinition = {
  name: EXTRACT_CV_ANALYSIS_TOOL_NAME,
  description: 'Report the structured analysis extracted from this CV text.',
  inputSchema: {
    type: 'object',
    properties: {
      summary: {
        type: 'string',
        description: 'A concise 1-3 sentence professional summary.',
      },
      skills: { type: 'array', items: { type: 'string' } },
      experienceYears: {
        type: ['number', 'null'],
        description:
          'Total years of professional experience, or null if unclear.',
      },
      education: {
        type: 'array',
        items: { type: 'string' },
        description:
          'Degrees/institutions, e.g. "B.Sc. Computer Science, XYZ University".',
      },
    },
    required: ['summary', 'skills', 'experienceYears', 'education'],
  },
} as const;
