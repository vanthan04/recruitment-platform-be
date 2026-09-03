import { NestFactory } from '@nestjs/core';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { AppModule } from '@/app.module';
import { GlobalExceptionFilter } from '@/common/filters/http-exception.filter';
import { ChatIoAdapter } from '@/common/adapters/socket-io.adapter';

export async function createHttpApp(): Promise<INestApplication> {
  // bufferLogs holds Nest's bootstrap-phase logs (module init, route
  // mapping, ...) until useLogger below swaps in the pino-backed logger,
  // so they're emitted as structured JSON too instead of the default logger.
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  // Runs OnModuleDestroy hooks (e.g. PrismaService.$disconnect) on
  // SIGTERM/SIGINT. Docker sends SIGTERM on every `docker stop` —
  // deploy-remote.sh does this on every deploy — so without this, a
  // redeploy on the long-lived EC2 container drops in-flight requests and
  // DB/WebSocket connections ungracefully instead of draining them.
  app.enableShutdownHooks();

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
