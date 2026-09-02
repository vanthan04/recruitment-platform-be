import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SavedSearchController } from '@/modules/job-alert/presentation/controllers/saved-search.controller';
import { ISavedSearchRepository } from '@/modules/job-alert/domain/repositories/saved-search.repository';
import { SavedSearchInfraRepository } from '@/modules/job-alert/infrastructure/repositories/saved-search.infra-repository';
import { SavedSearchPrismaRepository } from '@/modules/job-alert/infrastructure/persistence/prisma/saved-search-prisma.repository';
import { CategoryModule } from '@/modules/category/category.module';
import { JobModule } from '@/modules/job/job.module';
import { UserModule } from '@/modules/user/user.module';
import { MailModule } from '@/modules/mail/mail.module';
import { ICategoryLookupPort } from '@/modules/job-alert/application/ports/category-lookup.port';
import { CategoryLookupAdapter } from '@/modules/job-alert/infrastructure/adapters/category-lookup.adapter';
import { IJobSearchPort } from '@/modules/job-alert/application/ports/job-search.port';
import { JobSearchAdapter } from '@/modules/job-alert/infrastructure/adapters/job-search.adapter';
import { IUserLookupPort } from '@/modules/job-alert/application/ports/user-lookup.port';
import { UserLookupAdapter } from '@/modules/job-alert/infrastructure/adapters/user-lookup.adapter';
import { IMailPort } from '@/modules/job-alert/application/ports/mail.port';
import { MailAdapter } from '@/modules/job-alert/infrastructure/adapters/mail.adapter';

import { CreateSavedSearchHandler } from '@/modules/job-alert/application/commands/create-saved-search.command';
import { DeleteSavedSearchHandler } from '@/modules/job-alert/application/commands/delete-saved-search.command';
import { SendJobAlertDigestsHandler } from '@/modules/job-alert/application/commands/send-job-alert-digests.command';
import { ListMySavedSearchesHandler } from '@/modules/job-alert/application/queries/list-my-saved-searches.query';

@Module({
  imports: [CqrsModule, CategoryModule, JobModule, UserModule, MailModule],
  controllers: [SavedSearchController],
  providers: [
    SavedSearchPrismaRepository,
    {
      provide: ISavedSearchRepository,
      useClass: SavedSearchInfraRepository,
    },
    {
      provide: ICategoryLookupPort,
      useClass: CategoryLookupAdapter,
    },
    {
      provide: IJobSearchPort,
      useClass: JobSearchAdapter,
    },
    {
      provide: IUserLookupPort,
      useClass: UserLookupAdapter,
    },
    {
      provide: IMailPort,
      useClass: MailAdapter,
    },
    CreateSavedSearchHandler,
    DeleteSavedSearchHandler,
    SendJobAlertDigestsHandler,
    ListMySavedSearchesHandler,
  ],
})
export class JobAlertModule {}
