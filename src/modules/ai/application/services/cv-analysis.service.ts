import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ICvAnalysisRepository } from '@/modules/ai/domain/repositories/cv-analysis.repository';
import { CvAnalysis } from '@/modules/ai/domain/entities/cv-analysis.entity';
import { ICvStoragePort } from '@/modules/cv/application/ports/cv-storage.port';
import { CvTextExtractor } from '@/modules/ai/infrastructure/text-extraction/cv-text-extractor';
import { IAiProvider } from '@/modules/ai/infrastructure/providers/ai-provider.interface';
import { CV_ANALYSIS_SYSTEM_PROMPT } from '@/modules/ai/prompts/cv-analysis.prompt';
import {
  CvAnalysisExtractionSchema,
  EXTRACT_CV_ANALYSIS_TOOL_NAME,
  extractCvAnalysisToolDefinition,
} from '@/modules/ai/schemas/cv-analysis-extraction.schema';

// A CV is a few pages at most — this bound exists only to keep one bad
// upload from blowing up the LLM context/cost, not to fit typical CVs.
const MAX_EXTRACTED_TEXT_CHARS = 20_000;

/**
 * Analyzes one CV's file into structured, persisted CvAnalysis data — run
 * once per CV (triggered by the `cv.uploaded` event, retried by the
 * analyze-pending-cvs cron), never re-run per matching request. Never
 * throws: every caller (event listener, cron) treats a single CV's failure
 * as data (CvAnalysisStatus.FAILED), not an exception to propagate.
 */
@Injectable()
export class CvAnalysisService {
  private readonly logger = new Logger(CvAnalysisService.name);
  private readonly model: string;

  constructor(
    private readonly cvAnalysisRepository: ICvAnalysisRepository,
    private readonly cvStorage: ICvStoragePort,
    private readonly textExtractor: CvTextExtractor,
    private readonly aiProvider: IAiProvider,
    private readonly configService: ConfigService,
  ) {
    this.model = this.configService.get<string>('AI_MODEL', 'claude-sonnet-5');
  }

  async analyzeCv(cvId: string): Promise<void> {
    const existing = await this.cvAnalysisRepository.findByCvId(cvId);
    const analysis = existing ?? new CvAnalysis({ cvId });

    try {
      const fileInfo = await this.cvAnalysisRepository.findCvFileInfo(cvId);
      if (!fileInfo) {
        this.logger.warn(
          `CvAnalysisService: Cv ${cvId} not found or deleted, skipping`,
        );
        return;
      }

      const buffer = await this.cvStorage.downloadBuffer(fileInfo.fileKey);
      const text = (
        await this.textExtractor.extractText(buffer, fileInfo.fileType)
      ).slice(0, MAX_EXTRACTED_TEXT_CHARS);

      const extraction = await this.extract(text);

      analysis.markCompleted({
        summary: extraction.summary,
        skills: extraction.skills,
        experienceYears: extraction.experienceYears,
        education: extraction.education,
        extractedText: text,
        model: this.model,
      });
      await this.cvAnalysisRepository.save(analysis);
      this.logger.log(
        `CvAnalysisService: analyzed cv ${cvId} (${extraction.skills.length} skills)`,
      );
    } catch (error) {
      // Never log `text`/`extractedText` — see file-level doc comments on
      // CvAnalysis and ai.exceptions.ts.
      const message = (error as Error).message ?? 'Unknown error';
      this.logger.warn(
        `CvAnalysisService: analysis failed for cv ${cvId}: ${message}`,
      );
      analysis.markFailed(message);
      await this.cvAnalysisRepository
        .save(analysis)
        .catch((saveError) =>
          this.logger.error(
            `CvAnalysisService: failed to persist FAILED status for cv ${cvId}`,
            (saveError as Error).stack,
          ),
        );
    }
  }

  private async extract(text: string): Promise<CvAnalysisExtractionSchema> {
    const response = await this.aiProvider.complete({
      system: CV_ANALYSIS_SYSTEM_PROMPT,
      tools: [extractCvAnalysisToolDefinition],
      forceToolUse: EXTRACT_CV_ANALYSIS_TOOL_NAME,
      messages: [{ role: 'user', content: `CV text:\n\n${text}` }],
    });

    const toolUse = response.toolUses.find(
      (t) => t.name === EXTRACT_CV_ANALYSIS_TOOL_NAME,
    );
    if (!toolUse) {
      throw new Error('AI provider did not call extract_cv_analysis');
    }

    const instance = plainToInstance(CvAnalysisExtractionSchema, toolUse.input);
    const errors = await validate(instance, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    if (errors.length > 0) {
      throw new Error(
        `AI provider returned invalid CV analysis: ${errors.map((e) => e.toString()).join('; ')}`,
      );
    }

    return instance;
  }
}
