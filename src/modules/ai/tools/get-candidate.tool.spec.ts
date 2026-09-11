import { createGetCandidateTool } from '@/modules/ai/tools/get-candidate.tool';
import { ICvAnalysisRepository } from '@/modules/ai/domain/repositories/cv-analysis.repository';
import { ToolContext } from '@/modules/ai/tools/ai-tool.interface';

function makeCtx(
  cvAnalysisRepository: jest.Mocked<ICvAnalysisRepository>,
): ToolContext {
  return {
    queryBus: {} as any,
    cvAnalysisRepository,
    recruiterId: 'recruiter-1',
    jobId: 'job-1',
    maxCandidates: 30,
  };
}

describe('get_candidate tool', () => {
  it('returns the analyzed candidate profile when found', async () => {
    const cvAnalysisRepository: jest.Mocked<ICvAnalysisRepository> = {
      findByCvId: jest.fn(),
      save: jest.fn(),
      findPendingCvIds: jest.fn(),
      searchCandidatePool: jest.fn(),
      findCandidateByUserId: jest.fn().mockResolvedValue({
        candidateId: 'cand-1',
        fullName: 'Jane Doe',
        headline: 'Backend Engineer',
        cvId: 'cv-1',
        skills: ['nestjs'],
        experienceYears: 3,
        education: [],
        summary: 'Solid backend engineer.',
      }),
      findCvFileInfo: jest.fn(),
    };

    const result = JSON.parse(
      await createGetCandidateTool(makeCtx(cvAnalysisRepository)).invoke({
        candidateId: 'cand-1',
      }),
    );

    expect(cvAnalysisRepository.findCandidateByUserId).toHaveBeenCalledWith(
      'cand-1',
    );
    expect(result.candidateId).toBe('cand-1');
  });

  it('reports found: false for a candidate with no completed analysis', async () => {
    const cvAnalysisRepository: jest.Mocked<ICvAnalysisRepository> = {
      findByCvId: jest.fn(),
      save: jest.fn(),
      findPendingCvIds: jest.fn(),
      searchCandidatePool: jest.fn(),
      findCandidateByUserId: jest.fn().mockResolvedValue(null),
      findCvFileInfo: jest.fn(),
    };

    const result = JSON.parse(
      await createGetCandidateTool(makeCtx(cvAnalysisRepository)).invoke({
        candidateId: 'cand-missing',
      }),
    );

    expect(result).toEqual({ found: false, candidateId: 'cand-missing' });
  });
});
