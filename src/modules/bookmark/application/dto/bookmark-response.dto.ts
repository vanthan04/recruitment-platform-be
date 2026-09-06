import { Bookmark } from '@/modules/bookmark/domain/entities/bookmark.entity';

export class BookmarkResponseDto {
  id: string;
  userId: string;
  jobId: string;
  createdAt: Date;
  // Never populated by any current mapper — kept as `unknown` rather than
  // a guessed shape until something actually sets it.
  job?: unknown;
}
