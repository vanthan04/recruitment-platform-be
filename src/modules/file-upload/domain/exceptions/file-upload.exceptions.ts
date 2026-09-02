import { BusinessRuleViolationException } from '@/common/exceptions/domain.exception';

/**
 * File-upload-module domain exceptions. See auth/cv/job modules for the
 * pattern: each carries a module-specific `code` while staying an
 * `instanceof` of the shared category so GlobalExceptionFilter still
 * resolves the right HTTP status.
 */

export class FileMissingException extends BusinessRuleViolationException {
  constructor() {
    super('No file was provided', 'FILE_UPLOAD_MISSING_FILE');
    this.name = 'FileMissingException';
  }
}

export class InvalidFileTypeException extends BusinessRuleViolationException {
  constructor(mimeType: string) {
    super(`File type "${mimeType}" is not allowed`, 'FILE_UPLOAD_INVALID_TYPE');
    this.name = 'InvalidFileTypeException';
  }
}
