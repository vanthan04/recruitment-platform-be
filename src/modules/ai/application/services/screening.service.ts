import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { PinoLogger } from 'nestjs-pino';
import { GetJobQuery } from '@/modules/job/application/queries/get-job.query';
import { ensureOwner } from '@/common/utils/ownership.util';
import { ICvAnalysisRepository } from '@/modules/ai/domain/repositories/cv-analysis.repository';
import {
  ScreeningAgent,
  ScreeningTurn,
} from '@/modules/ai/agents/screening.agent';
import { ScreeningToolRegistry } from '@/modules/ai/tools/screening-tool-registry';
import { ToolContext } from '@/modules/ai/tools/ai-tool.interface';

/**
 * Orchestration entry point for candidate screening Q&A — mirrors
 * AiMatchingService's shape: auth/RBAC via guards, ownership here, then the
 * agent. `candidateId` is bound into ToolContext so get_candidate/get_job
 * can never be redirected to a different job or candidate than the one this
 * request was authorized for (see their doc comments).
 */
@Injectable()
export class ScreeningService {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly cvAnalysisRepository: ICvAnalysisRepository,
    private readonly screeningAgent: ScreeningAgent,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ScreeningService.name);
  }

  async askQuestion(
    recruiterId: string,
    jobId: string,
    candidateId: string,
    question: string,
    priorTurns: ScreeningTurn[] = [],
  ): Promise<string> {
    const startedAt = Date.now();

    const job = await this.queryBus.execute(new GetJobQuery(jobId));
    ensureOwner(
      job.postedById,
      recruiterId,
      'Only the job poster can screen candidates for this job',
      'CANDIDATE_SCREEN_ACCESS_DENIED',
    );

    const toolContext: ToolContext = {
      queryBus: this.queryBus,
      cvAnalysisRepository: this.cvAnalysisRepository,
      recruiterId,
      jobId,
      candidateId,
      maxCandidates: 1,
    };
    const registry = new ScreeningToolRegistry(toolContext);

    this.logger.info(
      { jobId, recruiterId, candidateId },
      'ai-screening: request received',
    );

    const answer = await this.screeningAgent.ask(
      registry,
      question,
      priorTurns,
    );

    this.logger.info(
      {
        jobId,
        recruiterId,
        candidateId,
        durationMs: Date.now() - startedAt,
      },
      'ai-screening: request completed',
    );

    return answer;
  }
}
