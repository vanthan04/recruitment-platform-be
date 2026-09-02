import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JobApplicationController } from '@/modules/application/presentation/controllers/job-application.controller';
import { IJobApplicationRepository } from '@/modules/application/domain/repositories/job-application.repository';
import { JobApplicationInfraRepository } from '@/modules/application/infrastructure/repositories/job-application.infra-repository';
import { JobApplicationPrismaRepository } from '@/modules/application/infrastructure/persistence/prisma/job-application-prisma.repository';
import { JobModule } from '@/modules/job/job.module';
import { CvModule } from '@/modules/cv/cv.module';
import { IJobLookupPort } from '@/modules/application/application/ports/job-lookup.port';
import { JobLookupAdapter } from '@/modules/application/infrastructure/adapters/job-lookup.adapter';
import { ICvLookupPort } from '@/modules/application/application/ports/cv-lookup.port';
import { CvLookupAdapter } from '@/modules/application/infrastructure/adapters/cv-lookup.adapter';

import { ApplyJobHandler } from '@/modules/application/application/commands/apply-job.command';
import { UpdateApplicationStatusHandler } from '@/modules/application/application/commands/update-application-status.command';
import { WithdrawApplicationHandler } from '@/modules/application/application/commands/withdraw-application.command';
import { ListMyApplicationsHandler } from '@/modules/application/application/queries/list-my-applications.query';
import { ListApplicationsByJobHandler } from '@/modules/application/application/queries/list-applications-by-job.query';
import { GetJobStatsHandler } from '@/modules/application/application/queries/get-job-stats.query';

@Module({
  imports: [CqrsModule, JobModule, CvModule],
  controllers: [JobApplicationController],
  providers: [
    JobApplicationPrismaRepository,
    {
      provide: IJobApplicationRepository,
      useClass: JobApplicationInfraRepository,
    },
    {
      provide: IJobLookupPort,
      useClass: JobLookupAdapter,
    },
    {
      provide: ICvLookupPort,
      useClass: CvLookupAdapter,
    },
    ApplyJobHandler,
    UpdateApplicationStatusHandler,
    WithdrawApplicationHandler,
    ListMyApplicationsHandler,
    ListApplicationsByJobHandler,
    GetJobStatsHandler,
  ],
})
export class JobApplicationModule {}
