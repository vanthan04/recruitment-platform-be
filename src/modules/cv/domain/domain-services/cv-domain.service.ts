import { Cv } from '@/modules/cv/domain/entities/cv.entity';
import {
  CV_ALLOWED_MIME_TYPES,
  CvFileType,
} from '@/modules/cv/domain/value-objects/cv-file-type.vo';
import {
  CvNotPublishedForApplicationException,
  CvDeletedForApplicationException,
  CvFileRequiredException,
  CvInvalidFileTypeException,
  CvFileTooLargeException,
} from '@/modules/cv/domain/exceptions/cv.exceptions';

export interface UploadedCvFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/**
 * CV Domain Service.
 * Handles business logic that spans across multiple entities
 * or doesn't naturally belong to a single entity.
 * Framework-agnostic — no NestJS or Prisma imports.
 */
export class CvDomainService {
  /**
   * Validate that a CV is ready for job application.
   * Must be published and not deleted.
   */
  static validateForApplication(cv: Cv): void {
    if (!cv.isPublished) {
      throw new CvNotPublishedForApplicationException();
    }

    if (cv.isDeleted) {
      throw new CvDeletedForApplicationException();
    }
  }

  /**
   * Validate an uploaded CV file's type and size, and resolve its CvFileType.
   * Never trusts the client-supplied filename extension for anything but a
   * cosmetic check — the MIME type reported by Multer is the source of truth.
   */
  static validateUploadedFile(
    file: UploadedCvFile | undefined,
    maxFileSizeBytes: number,
  ): CvFileType {
    if (!file || !file.buffer || file.size === 0) {
      throw new CvFileRequiredException();
    }

    const fileType = CV_ALLOWED_MIME_TYPES[file.mimetype];
    if (!fileType) {
      throw new CvInvalidFileTypeException(file.mimetype);
    }

    if (file.size > maxFileSizeBytes) {
      throw new CvFileTooLargeException(file.size, maxFileSizeBytes);
    }

    return fileType;
  }
}
