import { Module } from '@nestjs/common';
import { BookmarkController } from '@/modules/bookmark/presentation/controllers/bookmark.controller';
import { IBookmarkRepository } from '@/modules/bookmark/domain/repositories/bookmark.repository';
import { BookmarkInfraRepository } from '@/modules/bookmark/infrastructure/repositories/bookmark.infra-repository';
import { BookmarkPrismaRepository } from '@/modules/bookmark/infrastructure/persistence/prisma/bookmark-prisma.repository';
import { JobModule } from '@/modules/job/job.module';

// Use Cases
import { ToggleBookmarkUseCase } from '@/modules/bookmark/application/use-cases/toggle-bookmark.use-case';
import { ListBookmarksUseCase } from '@/modules/bookmark/application/use-cases/list-bookmarks.use-case';

@Module({
  imports: [JobModule],
  controllers: [BookmarkController],
  providers: [
    BookmarkPrismaRepository,
    {
      provide: IBookmarkRepository,
      useClass: BookmarkInfraRepository,
    },
    ToggleBookmarkUseCase,
    ListBookmarksUseCase,
  ],
})
export class BookmarkModule {}
