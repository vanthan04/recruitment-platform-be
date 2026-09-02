import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JobController } from '@/modules/job/presentation/controllers/job.controller';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { JobInfraRepository } from '@/modules/job/infrastructure/repositories/job.infra-repository';
import { JobPrismaRepository } from '@/modules/job/infrastructure/persistence/prisma/job-prisma.repository';
import { UserModule } from '@/modules/user/user.module';
import { CategoryModule } from '@/modules/category/category.module';
import { CompanyModule } from '@/modules/company/company.module';
import { IUserLookupPort } from '@/modules/job/application/ports/user-lookup.port';
import { UserLookupAdapter } from '@/modules/job/infrastructure/adapters/user-lookup.adapter';
import { ICategoryLookupPort } from '@/modules/job/application/ports/category-lookup.port';
import { CategoryLookupAdapter } from '@/modules/job/infrastructure/adapters/category-lookup.adapter';
import { ICompanyLookupPort } from '@/modules/job/application/ports/company-lookup.port';
import { CompanyLookupAdapter } from '@/modules/job/infrastructure/adapters/company-lookup.adapter';

import { CreateJobHandler } from '@/modules/job/application/commands/create-job.command';
import { UpdateJobHandler } from '@/modules/job/application/commands/update-job.command';
import { DeleteJobHandler } from '@/modules/job/application/commands/delete-job.command';
import { CloseJobHandler } from '@/modules/job/application/commands/close-job.command';
import { ReopenJobHandler } from '@/modules/job/application/commands/reopen-job.command';
import { CloseExpiredJobsHandler } from '@/modules/job/application/commands/close-expired-jobs.command';
import { GetJobHandler } from '@/modules/job/application/queries/get-job.query';
import { ListJobsHandler } from '@/modules/job/application/queries/list-jobs.query';

@Module({
  imports: [CqrsModule, UserModule, CategoryModule, CompanyModule],
  controllers: [JobController],
  providers: [
    JobPrismaRepository,
    {
      provide: IJobRepository,
      useClass: JobInfraRepository,
    },
    {
      provide: IUserLookupPort,
      useClass: UserLookupAdapter,
    },
    {
      provide: ICategoryLookupPort,
      useClass: CategoryLookupAdapter,
    },
    {
      provide: ICompanyLookupPort,
      useClass: CompanyLookupAdapter,
    },
    CreateJobHandler,
    UpdateJobHandler,
    DeleteJobHandler,
    CloseJobHandler,
    ReopenJobHandler,
    CloseExpiredJobsHandler,
    GetJobHandler,
    ListJobsHandler,
  ],
  exports: [IJobRepository],
})
export class JobModule {}
