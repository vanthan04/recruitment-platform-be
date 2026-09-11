import { QueryBus } from '@nestjs/cqrs';
import { ICvAnalysisRepository } from '@/modules/ai/domain/repositories/cv-analysis.repository';

/**
 * Request-scoped context every tool closure is built with — never derived
 * from LLM input. `recruiterId`/`jobId` come from the already-authenticated,
 * already-ownership-checked request (see AiMatchingService); tools must
 * never accept them as LLM-controlled arguments instead.
 */
export interface ToolContext {
  queryBus: QueryBus;
  cvAnalysisRepository: ICvAnalysisRepository;
  recruiterId: string;
  jobId: string;
  maxCandidates: number;
}
