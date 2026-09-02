import { NestFactory } from '@nestjs/core';
import {
  INestApplication,
  INestApplicationContext,
  ValidationPipe,
} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { AppModule } from '@/app.module';
import { GlobalExceptionFilter } from '@/common/filters/http-exception.filter';
import { ChatIoAdapter } from '@/common/adapters/socket-io.adapter';

/**
 * Single source of truth for HTTP app wiring — shared by the local/server
 * entry point (main.ts) and the API Gateway Lambda entry point (lambda.ts),
 * so the two never drift apart.
 */
export async function createHttpApp(): Promise<INestApplication> {
  // bufferLogs holds Nest's bootstrap-phase logs (module init, route
  // mapping, ...) until useLogger below swaps in the pino-backed logger,
  // so they're emitted as structured JSON too instead of the default logger.
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  app.use(helmet());
  app.setGlobalPrefix('api/v1');

  const corsOrigin = process.env.CORS_ORIGIN;
  app.enableCors({
    origin: corsOrigin ? corsOrigin.split(',').map((o) => o.trim()) : true,
    credentials: true,
  });

  app.useWebSocketAdapter(new ChatIoAdapter(app));

  const config = new DocumentBuilder()
    .setTitle('Job Portal API')
    .setDescription(
      'The Recruitment Platform Job Portal Backend API documentation',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/api/v1/docs', app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Resolved via DI (rather than `new GlobalExceptionFilter()`) so it gets
  // the injected PinoLogger.
  app.useGlobalFilters(app.get(GlobalExceptionFilter));

  return app;
}

/**
 * Lightweight DI-only bootstrap (no HTTP/Swagger/WebSocket layer) for
 * non-HTTP Lambda handlers — EventBridge Scheduler jobs, SQS consumers —
 * that only need to resolve a service/CommandBus and run it.
 */
export async function createAppContext(): Promise<INestApplicationContext> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  return app;
}
