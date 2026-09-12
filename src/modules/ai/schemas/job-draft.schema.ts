import { z } from 'zod';
import { tool } from '@langchain/core/tools';

/**
 * The only shape a job-draft call is ever trusted through. Unlike matching/
 * skill-suggestion there is no id to cross-check — this is free-text
 * drafting content, not a factual claim about a real record, so schema
 * validation here is about shape/bounds only.
 */
export const jobDraftSchema = z.object({
  title: z.string().max(150),
  description: z.string().max(5000),
  requirements: z.array(z.string().max(300)).max(20),
  benefits: z.array(z.string().max(300)).max(20),
});

export type JobDraft = z.infer<typeof jobDraftSchema>;

export const SUBMIT_JOB_DRAFT_TOOL_NAME = 'submit_job_draft';

/** Forced via `tool_choice` (see JobDraftService) — its `func` never actually runs; `tool_calls[0].args` are read and validated directly. */
export const submitJobDraftTool = tool(() => 'Draft recorded.', {
  name: SUBMIT_JOB_DRAFT_TOOL_NAME,
  description: 'Submit the drafted job posting content.',
  schema: jobDraftSchema,
});
