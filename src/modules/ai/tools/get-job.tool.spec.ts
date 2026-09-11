import { QueryBus } from '@nestjs/cqrs';
import { createGetJobTool } from '@/modules/ai/tools/get-job.tool';
import { GetJobQuery } from '@/modules/job/application/queries/get-job.query';
import { ToolContext } from '@/modules/ai/tools/ai-tool.interface';

describe('get_job tool', () => {
  it('always resolves to ctx.jobId via GetJobQuery, ignoring any jobId in the input', async () => {
    const queryBus = { execute: jest.fn().mockResolvedValue({ id: 'job-1' }) };
    const ctx = {
      queryBus: queryBus as unknown as QueryBus,
      jobId: 'job-1',
      recruiterId: 'recruiter-1',
      maxCandidates: 30,
    } as ToolContext;

    const result = await createGetJobTool(ctx).invoke({
      jobId: 'some-other-job',
    } as any);

    expect(queryBus.execute).toHaveBeenCalledWith(new GetJobQuery('job-1'));
    expect(JSON.parse(result as string)).toEqual({ id: 'job-1' });
  });
});
