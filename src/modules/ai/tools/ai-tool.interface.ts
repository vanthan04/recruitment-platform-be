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
  /**
   * Set only when exactly one candidate is already the subject of the
   * conversation (screening Q&A) — when present, get_candidate ignores
   * whatever candidateId the model passes and always uses this one, same
   * "never trust the LLM for a scoping value we already know" rule as
   * get_job's jobId. Left undefined for matching, where the candidate
   * genuinely varies call to call and must come from search results.
   */
  candidateId?: string;
}
