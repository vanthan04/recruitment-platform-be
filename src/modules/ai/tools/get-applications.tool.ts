import { ListApplicationsByJobQuery } from '@/modules/application/application/queries/list-applications-by-job.query';
import { AiTool, ToolContext } from '@/modules/ai/tools/ai-tool.interface';
import { optionalNumber } from '@/modules/ai/tools/tool-input.util';

/**
 * Reuses the existing ListApplicationsByJobQuery as-is — it already
 * enforces `ensureOwner(job.postedById, recruiterId)` internally, so even
 * if something upstream were ever misconfigured, this tool still can't read
 * another recruiter's applications. `recruiterId`/`jobId` always come from
 * ctx (the authenticated, already-authorized request) — never from the
 * LLM's input, and this tool never mutates an application's status.
 */
export function createGetApplicationsTool(ctx: ToolContext): AiTool {
  return {
    definition: {
      name: 'get_applications',
      description:
        'List existing applications for the job being matched (candidates who already applied), read-only.',
      inputSchema: {
        type: 'object',
        properties: {
          page: { type: 'number' },
          limit: { type: 'number' },
        },
      },
    },
    async execute(input) {
      const page = optionalNumber(input, 'page') ?? 1;
      const limit = optionalNumber(input, 'limit') ?? 20;
      return ctx.queryBus.execute(
        new ListApplicationsByJobQuery(ctx.recruiterId, ctx.jobId, page, limit),
      );
    },
  };
}
