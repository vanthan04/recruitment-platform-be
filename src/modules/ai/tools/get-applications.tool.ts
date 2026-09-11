import { z } from 'zod';
import { tool } from '@langchain/core/tools';
import { ListApplicationsByJobQuery } from '@/modules/application/application/queries/list-applications-by-job.query';
import { ToolContext } from '@/modules/ai/tools/ai-tool.interface';

/**
 * Reuses the existing ListApplicationsByJobQuery as-is — it already
 * enforces `ensureOwner(job.postedById, recruiterId)` internally, so even
 * if something upstream were ever misconfigured, this tool still can't read
 * another recruiter's applications. `recruiterId`/`jobId` always come from
 * ctx (the authenticated, already-authorized request) — never from the
 * LLM's input, and this tool never mutates an application's status.
 */
export function createGetApplicationsTool(ctx: ToolContext) {
  return tool(
    async (input) => {
      const result = await ctx.queryBus.execute(
        new ListApplicationsByJobQuery(
          ctx.recruiterId,
          ctx.jobId,
          input.page ?? 1,
          input.limit ?? 20,
        ),
      );
      return JSON.stringify(result);
    },
    {
      name: 'get_applications',
      description:
        'List existing applications for the job being matched (candidates who already applied), read-only.',
      schema: z.object({
        page: z.number().optional(),
        limit: z.number().optional(),
      }),
    },
  );
}
