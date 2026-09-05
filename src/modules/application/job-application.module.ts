import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JobApplicationController } from '@/modules/application/presentation/controllers/job-application.controller';
import { IJobApplicationRepository } from '@/modules/application/domain/repositories/job-application.repository';
import { JobApplicationInfraRepository } from '@/modules/application/infrastructure/repositories/job-application.infra-repository';
import { JobApplicationPrismaRepository } from '@/modules/application/infrastructure/persistence/prisma/job-application-prisma.repository';
import { IApplicationStatusHistoryRepository } from '@/modules/application/domain/repositories/application-status-history.repository';
import { ApplicationStatusHistoryInfraRepository } from '@/modules/application/infrastructure/repositories/application-status-history.infra-repository';
import { ApplicationStatusHistoryPrismaRepository } from '@/modules/application/infrastructure/persistence/prisma/application-status-history-prisma.repository';
import { JobModule } from '@/modules/job/job.module';
import { CvModule } from '@/modules/cv/cv.module';
import { UserModule } from '@/modules/user/user.module';
import { IJobLookupPort } from '@/modules/application/application/ports/job-lookup.port';
import { JobLookupAdapter } from '@/modules/application/infrastructure/adapters/job-lookup.adapter';
import { ICvLookupPort } from '@/modules/application/application/ports/cv-lookup.port';
import { CvLookupAdapter } from '@/modules/application/infrastructure/adapters/cv-lookup.adapter';
import { IApplicationUserLookupPort } from '@/modules/application/application/ports/user-lookup.port';
import { ApplicationUserLookupAdapter } from '@/modules/application/infrastructure/adapters/user-lookup.adapter';

import { ApplyJobHandler } from '@/modules/application/application/commands/apply-job.command';
import { UpdateApplicationStatusHandler } from '@/modules/application/application/commands/update-application-status.command';
import { WithdrawApplicationHandler } from '@/modules/application/application/commands/withdraw-application.command';
import { ListMyApplicationsHandler } from '@/modules/application/application/queries/list-my-applications.query';
import { ListApplicationsByJobHandler } from '@/modules/application/application/queries/list-applications-by-job.query';
import { GetJobStatsHandler } from '@/modules/application/application/queries/get-job-stats.query';
import { GetApplicationStatusHistoryHandler } from '@/modules/application/application/queries/get-application-status-history.query';

@Module({
  imports: [CqrsModule, JobModule, CvModule, UserModule],
  controllers: [JobApplicationController],
  providers: [
    JobApplicationPrismaRepository,
    {
      provide: IJobApplicationRepository,
      useClass: JobApplicationInfraRepository,
    },
    ApplicationStatusHistoryPrismaRepository,
    {
      provide: IApplicationStatusHistoryRepository,
      useClass: ApplicationStatusHistoryInfraRepository,
    },
    {
      provide: IJobLookupPort,
      useClass: JobLookupAdapter,
    },
    {
      provide: ICvLookupPort,
      useClass: CvLookupAdapter,
    },
    {
      provide: IApplicationUserLookupPort,
      useClass: ApplicationUserLookupAdapter,
    },
    ApplyJobHandler,
    UpdateApplicationStatusHandler,
    WithdrawApplicationHandler,
    ListMyApplicationsHandler,
    ListApplicationsByJobHandler,
    GetJobStatsHandler,
    GetApplicationStatusHistoryHandler,
  ],
  exports: [IJobApplicationRepository],
})
export class JobApplicationModule {}
