import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { BookmarkController } from '@/modules/bookmark/presentation/controllers/bookmark.controller';
import { IBookmarkRepository } from '@/modules/bookmark/domain/repositories/bookmark.repository';
import { BookmarkPrismaRepository } from '@/modules/bookmark/infrastructure/bookmark-prisma.repository';
import { JobModule } from '@/modules/job/job.module';
import { IJobLookupPort } from '@/modules/bookmark/application/ports/job-lookup.port';
import { JobLookupAdapter } from '@/modules/bookmark/infrastructure/adapters/job-lookup.adapter';

import { ToggleBookmarkHandler } from '@/modules/bookmark/application/commands/toggle-bookmark.command';
import { ListBookmarksHandler } from '@/modules/bookmark/application/queries/list-bookmarks.query';

@Module({
  imports: [CqrsModule, JobModule],
  controllers: [BookmarkController],
  providers: [
    {
      provide: IBookmarkRepository,
      useClass: BookmarkPrismaRepository,
    },
    {
      provide: IJobLookupPort,
      useClass: JobLookupAdapter,
    },
    ToggleBookmarkHandler,
    ListBookmarksHandler,
  ],
})
export class BookmarkModule {}
