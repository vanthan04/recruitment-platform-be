import { z } from 'zod';
import { tool } from '@langchain/core/tools';
import { GetJobQuery } from '@/modules/job/application/queries/get-job.query';
import { ToolContext } from '@/modules/ai/tools/ai-tool.interface';

/**
 * Retrieves the job being matched through the job module's own existing
 * GetJobQuery (CommandBus/QueryBus dispatch — no Prisma import here or
 * anywhere in src/modules/ai/tools). Always resolves to `ctx.jobId`, the
 * job the caller was already authorized against — the empty input schema
 * means the model has nothing to control here, so it can never wander off
 * to inspect an unrelated job.
 */
export function createGetJobTool(ctx: ToolContext) {
  return tool(
    async () => {
      const job = await ctx.queryBus.execute(new GetJobQuery(ctx.jobId));
      return JSON.stringify(job);
    },
    {
      name: 'get_job',
      description:
        'Retrieve full details of the job posting being matched: title, description, required skills, level, employment type, and location.',
      schema: z.object({}),
    },
  );
}
