import { InvalidFileTypeException } from '@/modules/file-upload/domain/exceptions/file-upload.exceptions';

export interface UploadedFileLike {
  mimetype: string;
  buffer: Buffer;
}

/**
 * File-signature ("magic bytes") each MIME type actually starts with,
 * independent of whatever Content-Type the client's multipart request
 * declared — that header is entirely attacker-controlled and trivially
 * spoofed (mirrors CvDomainService's approach for CV uploads). WebP is
 * handled separately below since RIFF is a generic container format and
 * needs a second check at offset 8 to confirm it's actually WebP.
 */
const MAGIC_BYTES: Record<string, Buffer[]> = {
  'image/png': [Buffer.from('89504E47', 'hex')],
  'image/jpeg': [Buffer.from('FFD8FF', 'hex')],
  'image/gif': [Buffer.from('474946', 'hex')],
  'application/pdf': [Buffer.from('25504446', 'hex')],
  'application/msword': [Buffer.from('D0CF11E0A1B11AE1', 'hex')],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    Buffer.from('504B0304', 'hex'),
    Buffer.from('504B0506', 'hex'),
    Buffer.from('504B0708', 'hex'),
  ],
};

const WEBP_RIFF_HEADER = Buffer.from('52494646', 'hex'); // "RIFF" at offset 0
const WEBP_MARKER = Buffer.from('57454250', 'hex'); // "WEBP" at offset 8

export class FileUploadDomainService {
  /**
   * Verifies the file's actual bytes match its claimed MIME type. Throws
   * the same `InvalidFileTypeException` the allowlist check uses, so a
   * spoofed Content-Type is rejected exactly like a disallowed one.
   */
  static validateFileSignature(file: UploadedFileLike): void {
    if (file.mimetype === 'image/webp') {
      const isWebp =
        file.buffer.length >= 12 &&
        file.buffer.subarray(0, 4).equals(WEBP_RIFF_HEADER) &&
        file.buffer.subarray(8, 12).equals(WEBP_MARKER);
      if (!isWebp) {
        throw new InvalidFileTypeException(file.mimetype);
      }
      return;
    }

    const signatures = MAGIC_BYTES[file.mimetype];
    if (!signatures) {
      return;
    }

    const matches = signatures.some(
      (signature) =>
        file.buffer.length >= signature.length &&
        file.buffer.subarray(0, signature.length).equals(signature),
    );
    if (!matches) {
      throw new InvalidFileTypeException(file.mimetype);
    }
  }
}
