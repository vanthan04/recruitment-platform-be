import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { InterviewModule } from '@/modules/interview/interview.module';
import { IDetectionServicePort } from '@/modules/monitoring/application/ports/detection-service.port';
import { IMonitoringInterviewAccessPort } from '@/modules/monitoring/application/ports/interview-access.port';
import { IDetectionEventRepository } from '@/modules/monitoring/domain/repositories/detection-event.repository';
import { HttpDetectionServiceAdapter } from '@/modules/monitoring/infrastructure/adapters/http-detection-service.adapter';
import { MonitoringInterviewAccessAdapter } from '@/modules/monitoring/infrastructure/adapters/interview-access.adapter';
import { DetectionEventPrismaRepository } from '@/modules/monitoring/infrastructure/persistence/prisma/detection-event-prisma.repository';
import { DetectionEventInfraRepository } from '@/modules/monitoring/infrastructure/repositories/detection-event.infra-repository';
import { MonitoringGateway } from '@/modules/monitoring/infrastructure/gateways/monitoring.gateway';
import { MonitoringEventTracker } from '@/modules/monitoring/application/services/monitoring-event-tracker.service';
import { MonitoringController } from '@/modules/monitoring/presentation/controllers/monitoring.controller';
import { ListDetectionEventsHandler } from '@/modules/monitoring/application/queries/list-detection-events.query';
import { GetDetectionSummaryHandler } from '@/modules/monitoring/application/queries/get-detection-summary.query';
import { ReviewDetectionEventHandler } from '@/modules/monitoring/application/commands/review-detection-event.command';
import { PurgeExpiredDetectionEventsHandler } from '@/modules/monitoring/application/commands/purge-expired-detection-events.command';
import { PurgeExpiredDetectionEventsCron } from '@/modules/monitoring/application/jobs/purge-expired-detection-events.cron';

/**
 * AI interview monitoring: the frame channel to the AI service (Phase 3) and
 * the events derived from it (Phase 4). Authorization and consent go through
 * the interview module (RecordMonitoringConsentCommand on the shared
 * CommandBus, and its exported read repositories behind
 * IMonitoringInterviewAccessPort).
 */
@Module({
  imports: [
    CqrsModule,
    ConfigModule,
    InterviewModule,
    // MonitoringGateway verifies the `access_token` cookie itself (like the
    // chat and room gateways); AuthModule's JwtModule isn't exported.
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [MonitoringController],
  providers: [
    { provide: IDetectionServicePort, useClass: HttpDetectionServiceAdapter },
    {
      provide: IMonitoringInterviewAccessPort,
      useClass: MonitoringInterviewAccessAdapter,
    },
    DetectionEventPrismaRepository,
    {
      provide: IDetectionEventRepository,
      useClass: DetectionEventInfraRepository,
    },
    MonitoringEventTracker,
    MonitoringGateway,
    ListDetectionEventsHandler,
    GetDetectionSummaryHandler,
    ReviewDetectionEventHandler,
    PurgeExpiredDetectionEventsHandler,
    PurgeExpiredDetectionEventsCron,
  ],
})
export class MonitoringModule {}
