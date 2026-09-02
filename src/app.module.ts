import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuthModule } from '@/modules/auth/auth.module';
import { UserModule } from '@/modules/user/user.module';
import { PrismaModule } from '@/modules/prisma/prisma.module';
import { FileUploadModule } from '@/modules/file-upload/file-upload.module';
import { CompanyModule } from '@/modules/company/company.module';
import { CategoryModule } from '@/modules/category/category.module';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      load: [appConfig],
    }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    PrismaModule.forRoot({
      log: ['query', 'info', 'warn', 'error'],
      errorFormat: 'pretty',
    }),
    AuthModule,
    UserModule,
    FileUploadModule,
    CompanyModule,
    CategoryModule,
    CvModule,
    JobModule,
    JobApplicationModule,
    BookmarkModule,
    NotificationModule,
    JobAlertModule,
    ChatModule,
    InterviewModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
