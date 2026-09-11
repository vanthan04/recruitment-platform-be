import { QueryBus } from '@nestjs/cqrs';
import { createGetApplicationsTool } from '@/modules/ai/tools/get-applications.tool';
import { ListApplicationsByJobQuery } from '@/modules/application/application/queries/list-applications-by-job.query';
import { ToolContext } from '@/modules/ai/tools/ai-tool.interface';

describe('get_applications tool', () => {
  it('always binds recruiterId/jobId from ctx, never from the input', async () => {
    const queryBus = {
      execute: jest.fn().mockResolvedValue({ applications: [] }),
    };
    const ctx: ToolContext = {
      queryBus: queryBus as unknown as QueryBus,
      cvAnalysisRepository: {} as any,
      recruiterId: 'recruiter-1',
      jobId: 'job-1',
      maxCandidates: 30,
    };

    await createGetApplicationsTool(ctx).invoke({
      page: 2,
      limit: 10,
    } as any);

    expect(queryBus.execute).toHaveBeenCalledWith(
      new ListApplicationsByJobQuery('recruiter-1', 'job-1', 2, 10),
    );
  });

  it('defaults page/limit when omitted', async () => {
    const queryBus = {
      execute: jest.fn().mockResolvedValue({ applications: [] }),
    };
    const ctx: ToolContext = {
      queryBus: queryBus as unknown as QueryBus,
      cvAnalysisRepository: {} as any,
      recruiterId: 'recruiter-1',
      jobId: 'job-1',
      maxCandidates: 30,
    };

    await createGetApplicationsTool(ctx).invoke({} as any);

    expect(queryBus.execute).toHaveBeenCalledWith(
      new ListApplicationsByJobQuery('recruiter-1', 'job-1', 1, 20),
    );
  });
});
