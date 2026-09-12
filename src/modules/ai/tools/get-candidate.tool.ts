import { z } from 'zod';
import { tool } from '@langchain/core/tools';
import { ToolContext } from '@/modules/ai/tools/ai-tool.interface';

/**
 * Returns only what recruitment matching needs (name, headline, analyzed
 * skills/experience/education/summary) — deliberately never email, phone,
 * birthDate, or gender, even though the recruiter's own existing
 * candidate-detail views may show those elsewhere. Never returns a CV file
 * key or download URL; see get-cv-analysis.tool.ts for the same rule.
 *
 * When `ctx.candidateId` is set (screening Q&A, exactly one candidate in
 * scope), it always wins over the model's input — same defensive pattern
 * as get_job's jobId. For matching, `ctx.candidateId` is undefined and the
 * model's own input is used, since the candidate genuinely varies per call.
 */
export function createGetCandidateTool(ctx: ToolContext) {
  return tool(
    async (input) => {
      const candidateId = ctx.candidateId ?? input.candidateId;
      const candidate =
        await ctx.cvAnalysisRepository.findCandidateByUserId(candidateId);
      return JSON.stringify(candidate ?? { found: false, candidateId });
    },
    {
      name: 'get_candidate',
      description:
        "Retrieve one candidate's profile summary and analyzed CV skills/experience/education for closer evaluation.",
      schema: z.object({
        candidateId: z.string(),
      }),
    },
  );
}
