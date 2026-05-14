import { Bookmark } from '@/modules/bookmark/domain/entities/bookmark.entity';

export class BookmarkResponseDto {
  id: string;
  userId: string;
  jobId: string;
  createdAt: Date;
  job?: any;
}
