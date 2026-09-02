import { EntityNotFoundException } from '@/common/exceptions/domain.exception';

/**
 * Bookmark-module domain exceptions. See auth/cv/job modules for the
 * pattern: each carries a module-specific `code` while staying an
 * `instanceof` of the shared category so GlobalExceptionFilter still
 * resolves the right HTTP status.
 */

export class BookmarkedJobNotFoundException extends EntityNotFoundException {
  constructor(id?: string) {
    super('Job', id, 'BOOKMARK_JOB_NOT_FOUND');
    this.name = 'BookmarkedJobNotFoundException';
  }
}
