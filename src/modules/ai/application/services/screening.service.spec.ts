import { QueryBus } from '@nestjs/cqrs';
import { ScreeningService } from '@/modules/ai/application/services/screening.service';
import { ICvAnalysisRepository } from '@/modules/ai/domain/repositories/cv-analysis.repository';
import { ScreeningAgent } from '@/modules/ai/agents/screening.agent';
import { UnauthorizedDomainException } from '@/common/exceptions/domain.exception';

function makeService(overrides: { postedById?: string } = {}) {
  const queryBus = {
    execute: jest.fn().mockResolvedValue({
      id: 'job-1',
      postedById: overrides.postedById ?? 'recruiter-1',
    }),
  };
  const cvAnalysisRepository: jest.Mocked<ICvAnalysisRepository> = {
    findByCvId: jest.fn(),
    save: jest.fn(),
    findPendingCvIds: jest.fn(),
    searchCandidatePool: jest.fn(),
    findCandidateByUserId: jest.fn(),
    findCvFileInfo: jest.fn(),
  };
  const screeningAgent = { ask: jest.fn().mockResolvedValue('Yes.') };
  const logger = {
    setContext: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const service = new ScreeningService(
    queryBus as unknown as QueryBus,
    cvAnalysisRepository,
    screeningAgent as unknown as ScreeningAgent,
    logger as any,
  );

  return { service, queryBus, cvAnalysisRepository, screeningAgent };
}

describe('ScreeningService', () => {
  it('rejects a recruiter who does not own the job', async () => {
    const { service } = makeService({ postedById: 'someone-else' });

    await expect(
      service.askQuestion(
        'recruiter-1',
        'job-1',
        'cand-1',
        'Does this candidate know NestJS?',
      ),
    ).rejects.toThrow(UnauthorizedDomainException);
  });

  it('invokes the agent with a candidate-bound tool context on the happy path', async () => {
    const { service, screeningAgent } = makeService();

    const answer = await service.askQuestion(
      'recruiter-1',
      'job-1',
      'cand-1',
      'Does this candidate know NestJS?',
    );

    expect(answer).toBe('Yes.');
    expect(screeningAgent.ask).toHaveBeenCalledTimes(1);
    const [registry, question] = screeningAgent.ask.mock.calls[0];
    expect(question).toBe('Does this candidate know NestJS?');
    expect(registry.tools.map((t: { name: string }) => t.name)).toEqual([
      'get_job',
      'get_candidate',
      'get_cv_analysis',
    ]);
  });
});
