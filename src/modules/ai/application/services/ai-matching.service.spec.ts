import { QueryBus } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import { AiMatchingService } from '@/modules/ai/application/services/ai-matching.service';
import { ICvAnalysisRepository } from '@/modules/ai/domain/repositories/cv-analysis.repository';
import { RecruitmentAgent } from '@/modules/ai/agents/recruitment.agent';
import { UnauthorizedDomainException } from '@/common/exceptions/domain.exception';

function makeJob(
  overrides: Partial<{
    postedById: string;
    skills: { id: string; name: string; slug: string }[];
  }> = {},
) {
  return {
    id: 'job-1',
    title: 'Backend Developer',
    postedById: 'recruiter-1',
    skills: [{ id: 'skill-1', name: 'NestJS', slug: 'nestjs' }],
    ...overrides,
  };
}

describe('AiMatchingService', () => {
  let service: AiMatchingService;
  let queryBus: jest.Mocked<Pick<QueryBus, 'execute'>>;
  let cvAnalysisRepository: jest.Mocked<ICvAnalysisRepository>;
  let agent: jest.Mocked<Pick<RecruitmentAgent, 'run'>>;
  let configService: { get: jest.Mock };
  let logger: {
    setContext: jest.Mock;
    info: jest.Mock;
    warn: jest.Mock;
    error: jest.Mock;
  };

  beforeEach(() => {
    queryBus = { execute: jest.fn() };
    cvAnalysisRepository = {
      findByCvId: jest.fn(),
      save: jest.fn(),
      findPendingCvIds: jest.fn(),
      searchCandidatePool: jest.fn(),
      findCandidateByUserId: jest.fn(),
      findCvFileInfo: jest.fn(),
    };
    agent = { run: jest.fn() };
    configService = {
      get: jest.fn((key: string, fallback?: unknown) => fallback),
    };
    logger = {
      setContext: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    service = new AiMatchingService(
      queryBus as unknown as QueryBus,
      cvAnalysisRepository,
      agent as unknown as RecruitmentAgent,
      configService as unknown as ConfigService,
      logger as any,
    );
  });

  it('rejects a recruiter who does not own the job', async () => {
    queryBus.execute.mockResolvedValue(makeJob({ postedById: 'someone-else' }));

    await expect(
      service.findMatchingCandidates('recruiter-1', 'job-1'),
    ).rejects.toThrow(UnauthorizedDomainException);
    expect(cvAnalysisRepository.searchCandidatePool).not.toHaveBeenCalled();
    expect(agent.run).not.toHaveBeenCalled();
  });

  it('returns an empty result without invoking the agent when the candidate pool is empty', async () => {
    queryBus.execute.mockResolvedValue(makeJob());
    cvAnalysisRepository.searchCandidatePool.mockResolvedValue([]);

    const result = await service.findMatchingCandidates('recruiter-1', 'job-1');

    expect(result).toEqual({ jobId: 'job-1', matches: [] });
    expect(agent.run).not.toHaveBeenCalled();
  });

  it('invokes the agent and maps its result when the pool is non-empty', async () => {
    queryBus.execute.mockResolvedValue(makeJob());
    cvAnalysisRepository.searchCandidatePool.mockResolvedValue([
      {
        candidateId: 'cand-1',
        fullName: 'Jane Doe',
        headline: null,
        cvId: 'cv-1',
        skills: ['nestjs'],
        experienceYears: 2,
        education: [],
        summary: null,
      },
    ]);
    agent.run.mockResolvedValue({
      matches: [
        {
          candidateId: 'cand-1',
          score: 88,
          matchedSkills: ['NestJS'],
          missingSkills: [],
          reason: 'Strong backend fit.',
        },
      ],
    });

    const result = await service.findMatchingCandidates('recruiter-1', 'job-1');

    expect(agent.run).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(Number),
    );
    expect(result).toEqual({
      jobId: 'job-1',
      matches: [
        {
          candidateId: 'cand-1',
          score: 88,
          matchedSkills: ['NestJS'],
          missingSkills: [],
          reason: 'Strong backend fit.',
        },
      ],
    });
  });
});
