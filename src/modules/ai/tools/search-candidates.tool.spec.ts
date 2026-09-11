import { createSearchCandidatesTool } from '@/modules/ai/tools/search-candidates.tool';
import { ICvAnalysisRepository } from '@/modules/ai/domain/repositories/cv-analysis.repository';
import { ToolContext } from '@/modules/ai/tools/ai-tool.interface';

function makeCtx(overrides: Partial<ToolContext> = {}): {
  ctx: ToolContext;
  cvAnalysisRepository: jest.Mocked<ICvAnalysisRepository>;
} {
  const cvAnalysisRepository: jest.Mocked<ICvAnalysisRepository> = {
    findByCvId: jest.fn(),
    save: jest.fn(),
    findPendingCvIds: jest.fn(),
    searchCandidatePool: jest.fn().mockResolvedValue([]),
    findCandidateByUserId: jest.fn(),
    findCvFileInfo: jest.fn(),
  };
  return {
    ctx: {
      queryBus: {} as any,
      cvAnalysisRepository,
      recruiterId: 'recruiter-1',
      jobId: 'job-1',
      maxCandidates: 5,
      ...overrides,
    },
    cvAnalysisRepository,
  };
}

describe('search_candidates tool', () => {
  it('normalizes skill names and clamps the limit to ctx.maxCandidates regardless of input', async () => {
    const { ctx, cvAnalysisRepository } = makeCtx({ maxCandidates: 5 });

    await createSearchCandidatesTool(ctx).invoke({
      skills: [' NestJS ', 'PostgreSQL', 'nestjs'],
      minExperienceYears: 2,
    } as any);

    expect(cvAnalysisRepository.searchCandidatePool).toHaveBeenCalledWith({
      skills: ['nestjs', 'postgresql'],
      minExperienceYears: 2,
      limit: 5,
    });
  });

  it('defaults to no skill filter when none is given', async () => {
    const { ctx, cvAnalysisRepository } = makeCtx();

    await createSearchCandidatesTool(ctx).invoke({} as any);

    expect(cvAnalysisRepository.searchCandidatePool).toHaveBeenCalledWith({
      skills: [],
      minExperienceYears: undefined,
      limit: 5,
    });
  });
});
