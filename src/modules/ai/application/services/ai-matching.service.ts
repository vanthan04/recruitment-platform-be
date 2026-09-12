import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { GetJobQuery } from '@/modules/job/application/queries/get-job.query';
import { ensureOwner } from '@/common/utils/ownership.util';
import { ICvAnalysisRepository } from '@/modules/ai/domain/repositories/cv-analysis.repository';
import { normalizeSkills } from '@/modules/ai/domain/entities/cv-analysis.entity';
import { RecruitmentAgent } from '@/modules/ai/agents/recruitment.agent';
import { MatchingToolRegistry } from '@/modules/ai/tools/matching-tool-registry';
import { ToolContext } from '@/modules/ai/tools/ai-tool.interface';

export interface CandidateMatch {
  candidateId: string;
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  reason: string;
}

export interface MatchingCandidatesResult {
  jobId: string;
  matches: CandidateMatch[];
}

/**
 * Orchestration entry point for "Find Matching CVs":
 * Controller -> (auth/RBAC via guards) -> here (ownership) -> deterministic
 * pool check -> RecruitmentAgent -> validated result. The agent object is
 * constructed fresh per request with a ToolContext bound to this request's
 * already-authorized recruiterId/jobId — it never receives the raw request,
 * the recruiter's permissions, or any way to re-authorize itself. See
 * README/AI section (once documented) for the full data-flow diagram.
 */
@Injectable()
export class AiMatchingService {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly cvAnalysisRepository: ICvAnalysisRepository,
    private readonly recruitmentAgent: RecruitmentAgent,
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AiMatchingService.name);
  }

  async findMatchingCandidates(
    recruiterId: string,
    jobId: string,
  ): Promise<MatchingCandidatesResult> {
    const startedAt = Date.now();

    // GetJobQuery throws JobNotFoundException for a missing/deleted job —
    // no separate check needed here (see GetJobHandler/JobPrismaRepository).
    const job = await this.queryBus.execute(new GetJobQuery(jobId));
    ensureOwner(
      job.postedById,
      recruiterId,
      'Only the job poster can run candidate matching',
      'JOB_MATCH_ACCESS_DENIED',
    );

    const maxCandidates = this.configService.get<number>(
      'AI_MAX_CANDIDATES',
      30,
    );
    const model = this.configService.get<string>('AI_MODEL', 'claude-sonnet-5');

    // Deterministic filtering happens before any AI call — the same query
    // the search_candidates tool will use, run once up front purely to
    // decide whether it's worth invoking the LLM at all (see section 9 of
    // the feature spec: never send the AI provider an empty task).
    const jobSkillNames = normalizeSkills(job.skills.map((s) => s.name));
    const precheckPool = await this.cvAnalysisRepository.searchCandidatePool({
      skills: jobSkillNames,
      limit: maxCandidates,
    });

    this.logger.info(
      {
        jobId,
        recruiterId,
        candidatePoolSize: precheckPool.length,
        model,
      },
      'ai-matching: request received',
    );

    if (precheckPool.length === 0) {
      return { jobId, matches: [] };
    }

    const toolContext: ToolContext = {
      queryBus: this.queryBus,
      cvAnalysisRepository: this.cvAnalysisRepository,
      recruiterId,
      jobId,
      maxCandidates,
    };
    const registry = new MatchingToolRegistry(toolContext);

    const result = await this.recruitmentAgent.run(registry, maxCandidates);

    this.logger.info(
      {
        jobId,
        recruiterId,
        matchCount: result.matches.length,
        durationMs: Date.now() - startedAt,
      },
      'ai-matching: request completed',
    );

    return {
      jobId,
      matches: result.matches.map((match) => ({
        candidateId: match.candidateId,
        score: match.score,
        matchedSkills: match.matchedSkills,
        missingSkills: match.missingSkills,
        reason: match.reason,
      })),
    };
  }
}
