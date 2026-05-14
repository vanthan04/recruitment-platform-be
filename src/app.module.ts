import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@/modules/auth/auth.module';
import { UserModule } from '@/modules/user/user.module';
import { PrismaModule } from '@/modules/prisma/prisma.module';
import { FileUploadModule } from '@/modules/file-upload/file-upload.module';
import { CvModule } from '@/modules/cv/cv.module';
import { JobModule } from '@/modules/job/job.module';
import { JobApplicationModule } from '@/modules/application/job-application.module';
import { BookmarkModule } from '@/modules/bookmark/bookmark.module';
import { envValidationSchema } from '@/common/config/env.validation';
import appConfig from '@/common/config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      load: [appConfig],
    }),
    PrismaModule.forRoot({
      log: ['query', 'info', 'warn', 'error'],
      errorFormat: 'pretty',
    }),
    AuthModule,
    UserModule,
    FileUploadModule,
    CvModule,
    JobModule,
    JobApplicationModule,
    BookmarkModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
