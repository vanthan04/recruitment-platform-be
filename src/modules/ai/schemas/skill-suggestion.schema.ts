import { z } from 'zod';
import { tool } from '@langchain/core/tools';

/**
 * The only shape a skill-suggestion call is ever trusted through.
 * `skillIds` is cross-checked against the real taxonomy fetched via
 * ListSkillsQuery in SkillSuggestionService — any id not in that list is
 * dropped, never trusted (same "no fabricated ids" rule as matching's
 * candidateId check).
 */
export const skillSuggestionSchema = z.object({
  skillIds: z.array(z.string()),
});

export type SkillSuggestion = z.infer<typeof skillSuggestionSchema>;

export const SUBMIT_SKILL_SUGGESTIONS_TOOL_NAME = 'submit_skill_suggestions';

/** Forced via `tool_choice` (see SkillSuggestionService) — its `func` never actually runs; `tool_calls[0].args` are read and validated directly. */
export const submitSkillSuggestionsTool = tool(() => 'Suggestions recorded.', {
  name: SUBMIT_SKILL_SUGGESTIONS_TOOL_NAME,
  description:
    'Submit the ids of every skill from the provided taxonomy that applies to this job.',
  schema: skillSuggestionSchema,
});
