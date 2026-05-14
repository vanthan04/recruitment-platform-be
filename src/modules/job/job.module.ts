import { Module } from '@nestjs/common';
import { JobController } from '@/modules/job/presentation/controllers/job.controller';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { JobInfraRepository } from '@/modules/job/infrastructure/repositories/job.infra-repository';
import { JobPrismaRepository } from '@/modules/job/infrastructure/persistence/prisma/job-prisma.repository';

// Use Cases
import { CreateJobUseCase } from '@/modules/job/application/use-cases/create-job.use-case';
import { UpdateJobUseCase } from '@/modules/job/application/use-cases/update-job.use-case';
import { ListJobsUseCase } from '@/modules/job/application/use-cases/list-jobs.use-case';
import { GetJobUseCase } from '@/modules/job/application/use-cases/get-job.use-case';
import { DeleteJobUseCase } from '@/modules/job/application/use-cases/delete-job.use-case';

@Module({
  controllers: [JobController],
  providers: [
    JobPrismaRepository,
    {
      provide: IJobRepository,
      useClass: JobInfraRepository,
    },
    CreateJobUseCase,
    UpdateJobUseCase,
    ListJobsUseCase,
    GetJobUseCase,
    DeleteJobUseCase,
  ],
  exports: [IJobRepository],
})
export class JobModule {}
