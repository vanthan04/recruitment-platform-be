import { Module } from '@nestjs/common';
import { SavedSearchController } from '@/modules/job-alert/presentation/controllers/saved-search.controller';
import { ISavedSearchRepository } from '@/modules/job-alert/domain/repositories/saved-search.repository';
import { SavedSearchInfraRepository } from '@/modules/job-alert/infrastructure/repositories/saved-search.infra-repository';
import { SavedSearchPrismaRepository } from '@/modules/job-alert/infrastructure/persistence/prisma/saved-search-prisma.repository';
import { CategoryModule } from '@/modules/category/category.module';
import { JobModule } from '@/modules/job/job.module';
import { UserModule } from '@/modules/user/user.module';
import { MailModule } from '@/modules/mail/mail.module';

import { CreateSavedSearchUseCase } from '@/modules/job-alert/application/use-cases/create-saved-search.use-case';
import { ListMySavedSearchesUseCase } from '@/modules/job-alert/application/use-cases/list-my-saved-searches.use-case';
import { DeleteSavedSearchUseCase } from '@/modules/job-alert/application/use-cases/delete-saved-search.use-case';
import { JobAlertDigestCron } from '@/modules/job-alert/application/jobs/job-alert-digest.cron';

@Module({
  imports: [CategoryModule, JobModule, UserModule, MailModule],
  controllers: [SavedSearchController],
  providers: [
    SavedSearchPrismaRepository,
    {
      provide: ISavedSearchRepository,
      useClass: SavedSearchInfraRepository,
    },
    CreateSavedSearchUseCase,
    ListMySavedSearchesUseCase,
    DeleteSavedSearchUseCase,
    JobAlertDigestCron,
  ],
})
export class JobAlertModule {}
