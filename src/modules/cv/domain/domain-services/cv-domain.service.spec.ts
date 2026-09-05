import { CvDomainService } from '@/modules/cv/domain/domain-services/cv-domain.service';
import { CvFileType } from '@/modules/cv/domain/value-objects/cv-file-type.vo';
import {
  CvFileRequiredException,
  CvInvalidFileTypeException,
  CvFileTooLargeException,
} from '@/modules/cv/domain/exceptions/cv.exceptions';

const MAX_SIZE = 10 * 1024 * 1024;

const PDF_BYTES = Buffer.from('255044462d312e340a', 'hex'); // "%PDF-1.4\n"
const DOC_BYTES = Buffer.from('d0cf11e0a1b11ae100', 'hex'); // OLE compound file
const DOCX_BYTES = Buffer.from('504b03040a00000000', 'hex'); // zip local-file header
const EXE_BYTES = Buffer.from('4d5a90000300000004', 'hex'); // "MZ" — Windows PE header

describe('CvDomainService.validateUploadedFile', () => {
  it('throws when no file is provided', () => {
    expect(() =>
      CvDomainService.validateUploadedFile(undefined, MAX_SIZE),
    ).toThrow(CvFileRequiredException);
  });

  it('accepts application/pdf with a matching %PDF signature and resolves CvFileType.PDF', () => {
    const fileType = CvDomainService.validateUploadedFile(
      {
        originalname: 'cv.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: PDF_BYTES,
      },
      MAX_SIZE,
    );
    expect(fileType).toBe(CvFileType.PDF);
  });

  it('accepts application/msword with a matching OLE signature and resolves CvFileType.DOC', () => {
    const fileType = CvDomainService.validateUploadedFile(
      {
        originalname: 'cv.doc',
        mimetype: 'application/msword',
        size: 1024,
        buffer: DOC_BYTES,
      },
      MAX_SIZE,
    );
    expect(fileType).toBe(CvFileType.DOC);
  });

  it('accepts docx mime type with a matching zip signature and resolves CvFileType.DOCX', () => {
    const fileType = CvDomainService.validateUploadedFile(
      {
        originalname: 'cv.docx',
        mimetype:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 1024,
        buffer: DOCX_BYTES,
      },
      MAX_SIZE,
    );
    expect(fileType).toBe(CvFileType.DOCX);
  });

  it('rejects an unsupported MIME type regardless of file extension', () => {
    expect(() =>
      CvDomainService.validateUploadedFile(
        {
          originalname: 'cv.pdf',
          mimetype: 'application/zip',
          size: 1024,
          buffer: PDF_BYTES,
        },
        MAX_SIZE,
      ),
    ).toThrow(CvInvalidFileTypeException);
  });

  it('rejects a file larger than the configured max size', () => {
    expect(() =>
      CvDomainService.validateUploadedFile(
        {
          originalname: 'cv.pdf',
          mimetype: 'application/pdf',
          size: MAX_SIZE + 1,
          buffer: PDF_BYTES,
        },
        MAX_SIZE,
      ),
    ).toThrow(CvFileTooLargeException);
  });

  it('rejects a file whose content does not match its declared MIME type (spoofed Content-Type)', () => {
    expect(() =>
      CvDomainService.validateUploadedFile(
        {
          originalname: 'cv.pdf',
          mimetype: 'application/pdf',
          size: 1024,
          // An .exe disguised as a PDF via a spoofed multipart Content-Type —
          // exactly what magic-byte verification exists to catch.
          buffer: EXE_BYTES,
        },
        MAX_SIZE,
      ),
    ).toThrow(CvInvalidFileTypeException);
  });

  it('rejects a docx-declared upload whose content is not actually a zip container', () => {
    expect(() =>
      CvDomainService.validateUploadedFile(
        {
          originalname: 'cv.docx',
          mimetype:
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 1024,
          buffer: PDF_BYTES,
        },
        MAX_SIZE,
      ),
    ).toThrow(CvInvalidFileTypeException);
  });
});
