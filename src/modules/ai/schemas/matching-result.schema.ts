import { z } from 'zod';
import { tool } from '@langchain/core/tools';

/**
 * The only shape the AI provider's final answer is ever trusted through.
 * Parsed exclusively via `matchingResultSchema.parse()` in RecruitmentAgent
 * — never by parsing free-form text. A model response that fails this
 * validation is rejected outright (InvalidAiOutputException), never
 * partially trusted.
 */
export const candidateMatchSchema = z.object({
  candidateId: z.string(),
  score: z.number().int().min(0).max(100),
  matchedSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  reason: z.string().max(500),
});

export const matchingResultSchema = z.object({
  matches: z.array(candidateMatchSchema),
});

export type CandidateMatch = z.infer<typeof candidateMatchSchema>;
export type MatchingResult = z.infer<typeof matchingResultSchema>;

/**
 * The agent's one terminal "tool" — calling it is how it submits a final
 * answer instead of ending its turn with plain text. It is bound to the
 * model like any other tool but deliberately excluded from the graph's
 * ToolNode (see RecruitmentAgent): its `func` never actually runs, its
 * `tool_calls[].args` are read and validated directly once the graph ends.
 */
export const SUBMIT_MATCHING_RESULT_TOOL_NAME = 'submit_matching_result';

export const submitMatchingResultTool = tool(() => 'Result submitted.', {
  name: SUBMIT_MATCHING_RESULT_TOOL_NAME,
  description:
    'Submit your final ranked candidate matches for this job. Call this exactly once, when you are done evaluating candidates.',
  schema: matchingResultSchema,
});
