import { createGetCvAnalysisTool } from '@/modules/ai/tools/get-cv-analysis.tool';
import { ICvAnalysisRepository } from '@/modules/ai/domain/repositories/cv-analysis.repository';
import { CvAnalysis } from '@/modules/ai/domain/entities/cv-analysis.entity';
import { CvAnalysisStatus } from '@/modules/ai/domain/value-objects/cv-analysis-status.vo';
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

function makeRepo(): jest.Mocked<ICvAnalysisRepository> {
  return {
    findByCvId: jest.fn(),
    save: jest.fn(),
    findPendingCvIds: jest.fn(),
    searchCandidatePool: jest.fn(),
    findCandidateByUserId: jest.fn(),
    findCvFileInfo: jest.fn(),
  };
}

describe('get_cv_analysis tool', () => {
  it('never returns extractedText, even though the repository loads it', async () => {
    const cvAnalysisRepository = makeRepo();
    const analysis = new CvAnalysis({ cvId: 'cv-1' });
    analysis.markCompleted({
      summary: 'Backend engineer',
      skills: ['nestjs'],
      experienceYears: 3,
      education: [],
      extractedText: 'this candidate has a secret salary of $999,999',
      model: 'claude-sonnet-5',
    });
    cvAnalysisRepository.findByCvId.mockResolvedValue(analysis);

    const result = JSON.parse(
      await createGetCvAnalysisTool(makeCtx(cvAnalysisRepository)).invoke({
        cvId: 'cv-1',
      }),
    );

    expect(result).toEqual({
      cvId: 'cv-1',
      summary: 'Backend engineer',
      skills: ['nestjs'],
      experienceYears: 3,
      education: [],
    });
    expect(result.extractedText).toBeUndefined();
  });

  it('reports found: false for a CV with no completed analysis', async () => {
    const cvAnalysisRepository = makeRepo();
    cvAnalysisRepository.findByCvId.mockResolvedValue(
      new CvAnalysis({ cvId: 'cv-2', status: CvAnalysisStatus.PENDING }),
    );

    const result = JSON.parse(
      await createGetCvAnalysisTool(makeCtx(cvAnalysisRepository)).invoke({
        cvId: 'cv-2',
      }),
    );

    expect(result).toEqual({ found: false, cvId: 'cv-2' });
  });
});
