import { GetJobQuery } from '@/modules/job/application/queries/get-job.query';
import { AiTool, ToolContext } from '@/modules/ai/tools/ai-tool.interface';

/**
 * Retrieves the job being matched through the job module's own existing
 * GetJobQuery (CommandBus/QueryBus dispatch — no Prisma import here or
 * anywhere in src/ai/tools). Always resolves to `ctx.jobId`, the job the
 * caller was already authorized against — a `jobId` in the LLM's input is
 * accepted for schema-shape parity with the spec but intentionally ignored,
 * so the agent can never wander off to inspect an unrelated job.
 */
export function createGetJobTool(ctx: ToolContext): AiTool {
  return {
    definition: {
      name: 'get_job',
      description:
        'Retrieve full details of the job posting being matched: title, description, required skills, level, employment type, and location.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: true,
      },
    },
    async execute() {
      return ctx.queryBus.execute(new GetJobQuery(ctx.jobId));
    },
  };
}
