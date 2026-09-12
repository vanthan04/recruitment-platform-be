import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import { CvModule } from '@/modules/cv/cv.module';
import { AiController } from '@/modules/ai/presentation/controllers/ai.controller';
import { ICvAnalysisRepository } from '@/modules/ai/domain/repositories/cv-analysis.repository';
import { CvAnalysisInfraRepository } from '@/modules/ai/infrastructure/repositories/cv-analysis.infra-repository';
import { CvAnalysisPrismaRepository } from '@/modules/ai/infrastructure/persistence/prisma/cv-analysis-prisma.repository';
import { CvTextExtractor } from '@/modules/ai/infrastructure/text-extraction/cv-text-extractor';
import {
  MATCHING_CHAT_MODEL,
  matchingChatModelFactory,
  CV_ANALYSIS_CHAT_MODEL,
  cvAnalysisChatModelFactory,
  SCREENING_CHAT_MODEL,
  screeningChatModelFactory,
  SKILL_SUGGESTION_CHAT_MODEL,
  skillSuggestionChatModelFactory,
  JOB_DRAFT_CHAT_MODEL,
  jobDraftChatModelFactory,
} from '@/modules/ai/infrastructure/providers/chat-model.provider';
import { CvEventsListener } from '@/modules/ai/infrastructure/listeners/cv-events.listener';
import { CvAnalysisService } from '@/modules/ai/application/services/cv-analysis.service';
import { AiMatchingService } from '@/modules/ai/application/services/ai-matching.service';
import { ScreeningService } from '@/modules/ai/application/services/screening.service';
import { SkillSuggestionService } from '@/modules/ai/application/services/skill-suggestion.service';
import { JobDraftService } from '@/modules/ai/application/services/job-draft.service';
import { AnalyzePendingCvsCron } from '@/modules/ai/application/jobs/analyze-pending-cvs.cron';
import { RecruitmentAgent } from '@/modules/ai/agents/recruitment.agent';
import { ScreeningAgent } from '@/modules/ai/agents/screening.agent';

/**
 * Only imports CvModule — needed for ICvStoragePort (downloading a CV's
 * bytes for text extraction). getJob/get_applications/list-skills tools
 * dispatch their Queries via the shared QueryBus without a module import
 * (NestJS CQRS handlers self-register app-wide, independent of which
 * module declares them); candidate search/profile reads go through this
 * module's own CvAnalysis persistence, which queries the User/Cv tables
 * directly for the same reason CvPrismaRepository already does (see
 * CvAnalysisPrismaRepository's doc comment) — so JobModule,
 * JobApplicationModule, SkillModule, and UserModule are deliberately NOT
 * imported here.
 *
 * AiModule is never imported back by any of those modules — this is the
 * one-directional dependency the codebase's cross-module convention
 * requires (see JobApplicationModule for the same pattern).
 *
 * Five AI-driven capabilities live here, each with its own independently
 * configurable chat model (see chat-model.provider.ts):
 * matching (RecruitmentAgent), CV analysis (CvAnalysisService), candidate
 * screening Q&A (ScreeningAgent), job skill suggestion
 * (SkillSuggestionService), and job description drafting (JobDraftService).
 * Only matching and screening are full LangGraph agents (they decide which
 * of several tools to call); the other two are single forced-tool
 * completions — there is nothing for a model to "decide" to look up beyond
 * one deterministic query, so a tool-call loop would be needless ceremony.
 */
@Module({
  imports: [CqrsModule, CvModule],
  controllers: [AiController],
  providers: [
    CvAnalysisPrismaRepository,
    {
      provide: ICvAnalysisRepository,
      useClass: CvAnalysisInfraRepository,
    },
    CvTextExtractor,
    {
      provide: MATCHING_CHAT_MODEL,
      useFactory: matchingChatModelFactory,
      inject: [ConfigService],
    },
    {
      provide: CV_ANALYSIS_CHAT_MODEL,
      useFactory: cvAnalysisChatModelFactory,
      inject: [ConfigService],
    },
    {
      provide: SCREENING_CHAT_MODEL,
      useFactory: screeningChatModelFactory,
      inject: [ConfigService],
    },
    {
      provide: SKILL_SUGGESTION_CHAT_MODEL,
      useFactory: skillSuggestionChatModelFactory,
      inject: [ConfigService],
    },
    {
      provide: JOB_DRAFT_CHAT_MODEL,
      useFactory: jobDraftChatModelFactory,
      inject: [ConfigService],
    },
    CvAnalysisService,
    CvEventsListener,
    AnalyzePendingCvsCron,
    RecruitmentAgent,
    AiMatchingService,
    ScreeningAgent,
    ScreeningService,
    SkillSuggestionService,
    JobDraftService,
  ],
})
export class AiModule {}
