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
 * File-signature ("magic bytes") each allowed CvFileType actually starts
 * with, independent of whatever Content-Type the client's multipart request
 * declared. A `.docx` is a zip container (PK\x03\x04, or the empty/spanned
 * zip variants) — this can't distinguish it from some *other* zip-based
 * format renamed to `.docx`, but it does reject the common case this exists
 * to catch: an arbitrary binary (an executable, a raw macro payload, a
 * renamed script) wrapped in a spoofed multipart Content-Type header.
 */
const MAGIC_BYTES: Record<CvFileType, Buffer[]> = {
  [CvFileType.PDF]: [Buffer.from('25504446', 'hex')], // "%PDF"
  [CvFileType.DOC]: [Buffer.from('D0CF11E0A1B11AE1', 'hex')], // OLE compound file
  [CvFileType.DOCX]: [
    Buffer.from('504B0304', 'hex'),
    Buffer.from('504B0506', 'hex'),
    Buffer.from('504B0708', 'hex'),
  ],
};

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
   * The declared MIME type (from the client's multipart Content-Type, or a
   * spoofed one) only picks which CvFileType is *claimed* — the file's
   * actual byte signature must then agree with that claim, since Content-Type
   * is entirely attacker-controlled and trivially spoofed.
   */
  static validateUploadedFile(
    file: UploadedCvFile | undefined,
    maxFileSizeBytes: number,
  ): CvFileType {
    if (!file || !file.buffer || file.size === 0) {
      throw new CvFileRequiredException();
    }

    const fileType = CV_ALLOWED_MIME_TYPES[file.mimetype];
    if (!fileType || !this.matchesFileSignature(file.buffer, fileType)) {
      throw new CvInvalidFileTypeException(file.mimetype);
    }

    if (file.size > maxFileSizeBytes) {
      throw new CvFileTooLargeException(file.size, maxFileSizeBytes);
    }

    return fileType;
  }

  private static matchesFileSignature(
    buffer: Buffer,
    fileType: CvFileType,
  ): boolean {
    return MAGIC_BYTES[fileType].some(
      (signature) =>
        buffer.length >= signature.length &&
        buffer.subarray(0, signature.length).equals(signature),
    );
  }
}
