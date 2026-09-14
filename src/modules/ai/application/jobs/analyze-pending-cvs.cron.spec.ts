import { AnalyzePendingCvsCron } from '@/modules/ai/application/jobs/analyze-pending-cvs.cron';
import { ICvAnalysisRepository } from '@/modules/ai/domain/repositories/cv-analysis.repository';
import { CvAnalysisService } from '@/modules/ai/application/services/cv-analysis.service';

describe('AnalyzePendingCvsCron', () => {
  let cron: AnalyzePendingCvsCron;
  let cvAnalysisRepository: jest.Mocked<ICvAnalysisRepository>;
  let cvAnalysisService: jest.Mocked<Pick<CvAnalysisService, 'analyzeCv'>>;
  let configService: { get: jest.Mock };

  beforeEach(() => {
    cvAnalysisRepository = {
      findByCvId: jest.fn(),
      findByCvIdForJob: jest.fn(),
      save: jest.fn(),
      claimPendingCvIds: jest.fn().mockResolvedValue([]),
      searchCandidatePool: jest.fn(),
      findCandidateByUserId: jest.fn(),
      findCvFileInfo: jest.fn(),
    };
    cvAnalysisService = { analyzeCv: jest.fn() };
    configService = {
      get: jest.fn((key: string, fallback?: unknown) => fallback),
    };

    cron = new AnalyzePendingCvsCron(
      cvAnalysisRepository,
      cvAnalysisService as unknown as CvAnalysisService,
      configService as any,
    );
  });

  it('converts AI_ANALYSIS_CLAIM_STALE_MINUTES to milliseconds before claiming', async () => {
    configService.get.mockImplementation((key: string, fallback?: unknown) => {
      if (key === 'AI_ANALYSIS_BATCH_SIZE') return 20;
      if (key === 'AI_ANALYSIS_CLAIM_STALE_MINUTES') return 7;
      return fallback;
    });

    await cron.handle();

    expect(cvAnalysisRepository.claimPendingCvIds).toHaveBeenCalledWith(
      20,
      7 * 60_000,
    );
  });

  it('analyzes every claimed CV, one at a time', async () => {
    cvAnalysisRepository.claimPendingCvIds.mockResolvedValue(['cv-1', 'cv-2']);

    await cron.handle();

    expect(cvAnalysisService.analyzeCv).toHaveBeenNthCalledWith(1, 'cv-1');
    expect(cvAnalysisService.analyzeCv).toHaveBeenNthCalledWith(2, 'cv-2');
  });

  it('does nothing when nothing is claimed', async () => {
    cvAnalysisRepository.claimPendingCvIds.mockResolvedValue([]);

    await cron.handle();

    expect(cvAnalysisService.analyzeCv).not.toHaveBeenCalled();
  });
});
