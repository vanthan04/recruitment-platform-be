import { GetCvHandler, GetCvQuery } from './get-cv.query';
import { ICvRepository } from '@/modules/cv/domain/repositories/cv.repository';
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

describe('GetCvHandler', () => {
  let cvRepository: jest.Mocked<ICvRepository>;
  let handler: GetCvHandler;

  beforeEach(() => {
    cvRepository = {
      findById: jest.fn(),
      findAllByUserId: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      softDelete: jest.fn(),
      hasRecruiterAccess: jest.fn(),
      hasActiveApplicationReference: jest.fn(),
    };
    handler = new GetCvHandler(cvRepository);
  });

  it('throws CvNotFoundException when the CV does not exist', async () => {
    cvRepository.findById.mockResolvedValue(null);
    await expect(
      handler.execute(new GetCvQuery('candidate-1', 'missing-cv')),
    ).rejects.toThrow(CvNotFoundException);
  });

  it('allows the owning candidate to read their own CV', async () => {
    cvRepository.findById.mockResolvedValue(makeCv());
    const result = await handler.execute(
      new GetCvQuery('candidate-1', 'cv-1'),
    );
    expect(result.title).toBe('My CV');
    expect(cvRepository.hasRecruiterAccess).not.toHaveBeenCalled();
  });

  it("denies another candidate from reading someone else's CV (IDOR)", async () => {
    cvRepository.findById.mockResolvedValue(makeCv({ userId: 'candidate-1' }));
    cvRepository.hasRecruiterAccess.mockResolvedValue(false);
    await expect(
      handler.execute(new GetCvQuery('candidate-2', 'cv-1')),
    ).rejects.toThrow(CvDownloadAccessDeniedException);
  });

  it('allows a recruiter with a valid Job -> Application -> Cv chain', async () => {
    cvRepository.findById.mockResolvedValue(makeCv({ userId: 'candidate-1' }));
    cvRepository.hasRecruiterAccess.mockResolvedValue(true);
    const result = await handler.execute(
      new GetCvQuery('recruiter-1', 'cv-1'),
    );
    expect(result.title).toBe('My CV');
    expect(cvRepository.hasRecruiterAccess).toHaveBeenCalledWith(
      'cv-1',
      'recruiter-1',
    );
  });

  it('denies a recruiter with no application linking to this CV', async () => {
    cvRepository.findById.mockResolvedValue(makeCv({ userId: 'candidate-1' }));
    cvRepository.hasRecruiterAccess.mockResolvedValue(false);
    await expect(
      handler.execute(new GetCvQuery('recruiter-2', 'cv-1')),
    ).rejects.toThrow(CvDownloadAccessDeniedException);
  });
});
