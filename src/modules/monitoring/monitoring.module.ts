import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { IDetectionServicePort } from '@/modules/monitoring/application/ports/detection-service.port';
import { HttpDetectionServiceAdapter } from '@/modules/monitoring/infrastructure/adapters/http-detection-service.adapter';
import { MonitoringGateway } from '@/modules/monitoring/infrastructure/gateways/monitoring.gateway';

/**
 * AI interview monitoring. Authorization and consent go through the interview
 * module's RecordMonitoringConsentCommand on the shared CommandBus; this module
 * owns only the frame channel and the link to the AI service.
 */
@Module({
  imports: [
    CqrsModule,
    ConfigModule,
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
  providers: [
    { provide: IDetectionServicePort, useClass: HttpDetectionServiceAdapter },
    MonitoringGateway,
  ],
})
export class MonitoringModule {}
