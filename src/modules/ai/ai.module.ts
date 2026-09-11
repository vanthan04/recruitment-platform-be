import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CvModule } from '@/modules/cv/cv.module';
import { AiController } from '@/modules/ai/presentation/controllers/ai.controller';
import { ICvAnalysisRepository } from '@/modules/ai/domain/repositories/cv-analysis.repository';
import { CvAnalysisInfraRepository } from '@/modules/ai/infrastructure/repositories/cv-analysis.infra-repository';
import { CvAnalysisPrismaRepository } from '@/modules/ai/infrastructure/persistence/prisma/cv-analysis-prisma.repository';
import { CvTextExtractor } from '@/modules/ai/infrastructure/text-extraction/cv-text-extractor';
import { IAiProvider } from '@/modules/ai/infrastructure/providers/ai-provider.interface';
import { AnthropicAiProvider } from '@/modules/ai/infrastructure/providers/anthropic-ai.provider';
import { CvEventsListener } from '@/modules/ai/infrastructure/listeners/cv-events.listener';
import { CvAnalysisService } from '@/modules/ai/application/services/cv-analysis.service';
import { AiMatchingService } from '@/modules/ai/application/services/ai-matching.service';
import { AnalyzePendingCvsCron } from '@/modules/ai/application/jobs/analyze-pending-cvs.cron';
import { RecruitmentAgent } from '@/modules/ai/agents/recruitment.agent';

/**
 * Only imports CvModule — needed for ICvStoragePort (downloading a CV's
 * bytes for text extraction). getJob/get_applications tools dispatch
 * GetJobQuery/ListApplicationsByJobQuery via the shared QueryBus without a
 * module import (NestJS CQRS handlers self-register app-wide, independent
 * of which module declares them); candidate search/profile reads go
 * through this module's own CvAnalysis persistence, which queries the
 * User/Cv tables directly for the same reason CvPrismaRepository already
 * does (see CvAnalysisPrismaRepository's doc comment) — so JobModule,
 * JobApplicationModule, and UserModule are deliberately NOT imported here.
 *
 * AiModule is never imported back by any of those modules — this is the
 * one-directional dependency the codebase's cross-module convention
 * requires (see JobApplicationModule for the same pattern).
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
    {
      provide: IAiProvider,
      useClass: AnthropicAiProvider,
    },
    CvTextExtractor,
    CvAnalysisService,
    CvEventsListener,
    AnalyzePendingCvsCron,
    RecruitmentAgent,
    AiMatchingService,
  ],
})
export class AiModule {}
