import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from '@/app.controller';
import { GlobalExceptionFilter } from '@/common/filters/http-exception.filter';
import { buildLoggerOptions } from '@/common/config/logger.config';
import { AuthModule } from '@/modules/auth/auth.module';
import { UserModule } from '@/modules/user/user.module';
import { PrismaModule } from '@/modules/prisma/prisma.module';
import { PermissionModule } from '@/modules/permission/permission.module';
import { FileUploadModule } from '@/modules/file-upload/file-upload.module';
import { CompanyModule } from '@/modules/company/company.module';
import { CategoryModule } from '@/modules/category/category.module';
import { SkillModule } from '@/modules/skill/skill.module';
import { CvModule } from '@/modules/cv/cv.module';
import { JobModule } from '@/modules/job/job.module';
import { JobApplicationModule } from '@/modules/application/job-application.module';
import { BookmarkModule } from '@/modules/bookmark/bookmark.module';
import { NotificationModule } from '@/modules/notification/notification.module';
import { JobAlertModule } from '@/modules/job-alert/job-alert.module';
import { ChatModule } from '@/modules/chat/chat.module';
import { InterviewModule } from '@/modules/interview/interview.module';
import { envValidationSchema } from '@/common/config/env.validation';
import appConfig from '@/common/config/app.config';

// Prisma's own `log` option writes straight to stdout via its own
// formatter — it bypasses pino entirely, so none of the redaction rules in
// logger.config.ts apply to it. Full query logging (bound parameter values
// included) is a genuine debugging aid locally, but in production it's
// both a performance tax at real traffic volume and a way for request data
// (emails, names, tokens passed as query params) to end up in unstructured,
// unredacted logs. Only warnings/errors are worth the always-on cost there.
const isProduction = process.env.NODE_ENV === 'production';
const PRISMA_LOG_LEVELS = isProduction
  ? (['warn', 'error'] as const)
  : (['query', 'info', 'warn', 'error'] as const);

@Module({
  imports: [
    LoggerModule.forRoot(buildLoggerOptions()),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      load: [appConfig],
    }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    PrismaModule.forRoot({
      log: [...PRISMA_LOG_LEVELS],
      errorFormat: 'pretty',
    }),
    PermissionModule,
    AuthModule,
    UserModule,
    FileUploadModule,
    CompanyModule,
    CategoryModule,
    SkillModule,
    CvModule,
    JobModule,
    JobApplicationModule,
    BookmarkModule,
    NotificationModule,
    JobAlertModule,
    ChatModule,
    InterviewModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    GlobalExceptionFilter,
  ],
})
export class AppModule {}
