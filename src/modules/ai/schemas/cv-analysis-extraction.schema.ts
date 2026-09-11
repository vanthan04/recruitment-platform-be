import { z } from 'zod';
import { tool } from '@langchain/core/tools';

/**
 * The only shape a single-shot CV-analysis extraction call is ever trusted
 * through — see CvAnalysisService. Same "schema-validate, never freeform
 * parse" rule as matching-result.schema.ts.
 */
export const cvAnalysisExtractionSchema = z.object({
  summary: z.string().max(1000),
  skills: z.array(z.string()),
  experienceYears: z.number().min(0).max(60).nullable(),
  education: z.array(z.string()),
});

export type CvAnalysisExtraction = z.infer<typeof cvAnalysisExtractionSchema>;

export const EXTRACT_CV_ANALYSIS_TOOL_NAME = 'extract_cv_analysis';

/**
 * Forced via `tool_choice` (see CvAnalysisService) — its `func` never
 * actually runs since this is a one-shot `.invoke()`, not a graph; the
 * model's `tool_calls[0].args` are read and validated directly.
 */
export const extractCvAnalysisTool = tool(() => 'Analysis recorded.', {
  name: EXTRACT_CV_ANALYSIS_TOOL_NAME,
  description: 'Report the structured analysis extracted from this CV text.',
  schema: cvAnalysisExtractionSchema,
});
