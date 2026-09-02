import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter } from '@/common/filters/http-exception.filter';
import { ChatIoAdapter } from '@/common/adapters/socket-io.adapter';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Standard HTTP security headers (X-Frame-Options, X-Content-Type-Options, HSTS, etc.)
  app.use(helmet());

  // Set Global Prefix (Mapped from context-path: /api/v1)
  app.setGlobalPrefix('api/v1');

  // CORS — restrict to configured origin(s) in production; open by default for local dev
  const corsOrigin = process.env.CORS_ORIGIN;
  app.enableCors({
    origin: corsOrigin ? corsOrigin.split(',').map((o) => o.trim()) : true,
    credentials: true,
  });

  // Realtime chat — same CORS/credentials rule as the HTTP server above.
  app.useWebSocketAdapter(new ChatIoAdapter(app));

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Job Portal API')
    .setDescription('The Recruitment Platform Job Portal Backend API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/api/v1/docs', app, document);

  // Replaces @Valid from Java
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Replaces GlobalExceptionHandler from Java
  app.useGlobalFilters(new GlobalExceptionFilter());

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(`Application is running on: http://localhost:${port}`, 'Bootstrap');
}
bootstrap();
