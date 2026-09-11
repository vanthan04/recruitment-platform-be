import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  CV_UPLOADED_EVENT,
  CvUploadedEvent,
} from '@/modules/cv/infrastructure/events/cv-uploaded.event';
import { CvAnalysisService } from '@/modules/ai/application/services/cv-analysis.service';

@Injectable()
export class CvEventsListener {
  private readonly logger = new Logger(CvEventsListener.name);

  constructor(private readonly cvAnalysisService: CvAnalysisService) {}

  @OnEvent(CV_UPLOADED_EVENT)
  async handleCvUploaded(event: CvUploadedEvent): Promise<void> {
    // Fire-and-forget from the cv module's point of view — analysis
    // failures never propagate back to the (already-completed) upload
    // request. The analyze-pending-cvs cron is the safety net if this
    // listener itself throws before CvAnalysisService's own try/catch runs
    // (e.g. a DI/wiring error) or the process restarts mid-analysis.
    try {
      await this.cvAnalysisService.analyzeCv(event.cvId);
    } catch (err) {
      this.logger.error(
        `Failed to handle ${CV_UPLOADED_EVENT} for cv ${event.cvId}`,
        err instanceof Error ? err.stack : err,
      );
    }
  }
}
