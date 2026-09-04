import { CvDomainService } from '@/modules/cv/domain/domain-services/cv-domain.service';
import { CvFileType } from '@/modules/cv/domain/value-objects/cv-file-type.vo';
import {
  CvFileRequiredException,
  CvInvalidFileTypeException,
  CvFileTooLargeException,
} from '@/modules/cv/domain/exceptions/cv.exceptions';

const MAX_SIZE = 10 * 1024 * 1024;

describe('CvDomainService.validateUploadedFile', () => {
  it('throws when no file is provided', () => {
    expect(() =>
      CvDomainService.validateUploadedFile(undefined, MAX_SIZE),
    ).toThrow(CvFileRequiredException);
  });

  it('accepts application/pdf and resolves CvFileType.PDF', () => {
    const fileType = CvDomainService.validateUploadedFile(
      {
        originalname: 'cv.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('x'),
      },
      MAX_SIZE,
    );
    expect(fileType).toBe(CvFileType.PDF);
  });

  it('accepts application/msword and resolves CvFileType.DOC', () => {
    const fileType = CvDomainService.validateUploadedFile(
      {
        originalname: 'cv.doc',
        mimetype: 'application/msword',
        size: 1024,
        buffer: Buffer.from('x'),
      },
      MAX_SIZE,
    );
    expect(fileType).toBe(CvFileType.DOC);
  });

  it('accepts docx mime type and resolves CvFileType.DOCX', () => {
    const fileType = CvDomainService.validateUploadedFile(
      {
        originalname: 'cv.docx',
        mimetype:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 1024,
        buffer: Buffer.from('x'),
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
          buffer: Buffer.from('x'),
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
          buffer: Buffer.from('x'),
        },
        MAX_SIZE,
      ),
    ).toThrow(CvFileTooLargeException);
  });
});
