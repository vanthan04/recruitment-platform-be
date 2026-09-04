import { DownloadCvHandler, DownloadCvQuery } from './download-cv.query';
import { ICvRepository } from '@/modules/cv/domain/repositories/cv.repository';
import { ICvStoragePort } from '@/modules/cv/application/ports/cv-storage.port';
import { Cv } from '@/modules/cv/domain/entities/cv.entity';
import { CvFileType } from '@/modules/cv/domain/value-objects/cv-file-type.vo';
import {
  CvNotFoundException,
  CvDownloadAccessDeniedException,
} from '@/modules/cv/domain/exceptions/cv.exceptions';

function makeCv(overrides: Partial<Cv> = {}): Cv {
  return new Cv({
    title: 'My CV',
    originalName: 'my-cv.pdf',
    fileType: CvFileType.PDF,
    mimeType: 'application/pdf',
    fileSize: 1024,
    fileKey: 'cvs/candidate-1/2026/09/cv-1.pdf',
    userId: 'candidate-1',
    ...overrides,
  });
}

describe('DownloadCvHandler', () => {
  let cvRepository: jest.Mocked<ICvRepository>;
  let cvStorage: jest.Mocked<ICvStoragePort>;
  let handler: DownloadCvHandler;

  beforeEach(() => {
    cvRepository = {
      findById: jest.fn(),
      findAllByUserId: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      softDelete: jest.fn(),
      hasRecruiterAccess: jest.fn(),
    };
    cvStorage = {
      upload: jest.fn(),
      delete: jest.fn(),
      getDownloadUrl: jest.fn().mockResolvedValue('https://signed-url'),
    };
    handler = new DownloadCvHandler(cvRepository, cvStorage);
  });

  it('throws CvNotFoundException when the CV does not exist', async () => {
    cvRepository.findById.mockResolvedValue(null);
    await expect(
      handler.execute(new DownloadCvQuery('candidate-1', 'missing-cv')),
    ).rejects.toThrow(CvNotFoundException);
  });

  it('allows the owning candidate to download their own CV', async () => {
    cvRepository.findById.mockResolvedValue(makeCv());
    const result = await handler.execute(
      new DownloadCvQuery('candidate-1', 'cv-1'),
    );
    expect(result.url).toBe('https://signed-url');
    expect(cvRepository.hasRecruiterAccess).not.toHaveBeenCalled();
  });

  it("denies another candidate from downloading someone else's CV", async () => {
    cvRepository.findById.mockResolvedValue(makeCv({ userId: 'candidate-1' }));
    cvRepository.hasRecruiterAccess.mockResolvedValue(false);
    await expect(
      handler.execute(new DownloadCvQuery('candidate-2', 'cv-1')),
    ).rejects.toThrow(CvDownloadAccessDeniedException);
  });

  it('allows a recruiter with a valid Job -> Application -> Cv chain', async () => {
    cvRepository.findById.mockResolvedValue(makeCv({ userId: 'candidate-1' }));
    cvRepository.hasRecruiterAccess.mockResolvedValue(true);
    const result = await handler.execute(
      new DownloadCvQuery('recruiter-1', 'cv-1'),
    );
    expect(result.url).toBe('https://signed-url');
    expect(cvRepository.hasRecruiterAccess).toHaveBeenCalledWith(
      'cv-1',
      'recruiter-1',
    );
  });

  it('denies a recruiter with no application linking to this CV', async () => {
    cvRepository.findById.mockResolvedValue(makeCv({ userId: 'candidate-1' }));
    cvRepository.hasRecruiterAccess.mockResolvedValue(false);
    await expect(
      handler.execute(new DownloadCvQuery('recruiter-2', 'cv-1')),
    ).rejects.toThrow(CvDownloadAccessDeniedException);
  });
});
