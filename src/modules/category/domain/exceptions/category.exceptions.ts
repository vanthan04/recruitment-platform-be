import { EntityNotFoundException } from '@/common/exceptions/domain.exception';

/**
 * Category-module domain exceptions. See auth/cv/job modules for the
 * pattern: each carries a module-specific `code` while staying an
 * `instanceof` of the shared category so GlobalExceptionFilter still
 * resolves the right HTTP status.
 */

export class CategoryNotFoundException extends EntityNotFoundException {
  constructor(id?: string) {
    super('Category', id, 'CATEGORY_NOT_FOUND');
    this.name = 'CategoryNotFoundException';
  }
}
