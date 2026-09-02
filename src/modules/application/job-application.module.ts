import { Module } from '@nestjs/common';
import { JobApplicationController } from '@/modules/application/presentation/controllers/job-application.controller';
import { IJobApplicationRepository } from '@/modules/application/domain/repositories/job-application.repository';
import { JobApplicationInfraRepository } from '@/modules/application/infrastructure/repositories/job-application.infra-repository';
import { JobApplicationPrismaRepository } from '@/modules/application/infrastructure/persistence/prisma/job-application-prisma.repository';
import { JobModule } from '@/modules/job/job.module';
import { CvModule } from '@/modules/cv/cv.module';

// Use Cases
import { ApplyJobUseCase } from '@/modules/application/application/use-cases/apply-job.use-case';
import { UpdateApplicationStatusUseCase } from '@/modules/application/application/use-cases/update-application-status.use-case';
import { ListMyApplicationsUseCase } from '@/modules/application/application/use-cases/list-my-applications.use-case';
import { ListApplicationsByJobUseCase } from '@/modules/application/application/use-cases/list-applications-by-job.use-case';
import { WithdrawApplicationUseCase } from '@/modules/application/application/use-cases/withdraw-application.use-case';
import { GetJobStatsUseCase } from '@/modules/application/application/use-cases/get-job-stats.use-case';

@Module({
  imports: [JobModule, CvModule],
  controllers: [JobApplicationController],
  providers: [
    JobApplicationPrismaRepository,
    {
      provide: IJobApplicationRepository,
      useClass: JobApplicationInfraRepository,
    },
    ApplyJobUseCase,
    UpdateApplicationStatusUseCase,
    ListMyApplicationsUseCase,
    ListApplicationsByJobUseCase,
    WithdrawApplicationUseCase,
    GetJobStatsUseCase,
  ],
})
export class JobApplicationModule {}
