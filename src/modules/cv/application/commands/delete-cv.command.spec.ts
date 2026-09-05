import { DeleteCvHandler, DeleteCvCommand } from './delete-cv.command';
import { ICvRepository } from '@/modules/cv/domain/repositories/cv.repository';
import { Cv } from '@/modules/cv/domain/entities/cv.entity';
import { CvFileType } from '@/modules/cv/domain/value-objects/cv-file-type.vo';
import {
  CvNotFoundException,
  CvOwnershipException,
  CvReferencedByActiveApplicationException,
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

describe('DeleteCvHandler', () => {
  let cvRepository: jest.Mocked<ICvRepository>;
  let handler: DeleteCvHandler;

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
    handler = new DeleteCvHandler(cvRepository);
  });

  it('throws CvNotFoundException when the CV does not exist', async () => {
    cvRepository.findById.mockResolvedValue(null);
    await expect(
      handler.execute(new DeleteCvCommand('candidate-1', 'missing-cv')),
    ).rejects.toThrow(CvNotFoundException);
  });

  it('throws CvOwnershipException when another candidate tries to delete it', async () => {
    cvRepository.findById.mockResolvedValue(makeCv({ userId: 'candidate-1' }));
    await expect(
      handler.execute(new DeleteCvCommand('candidate-2', 'cv-1')),
    ).rejects.toThrow(CvOwnershipException);
  });

  it('throws CvReferencedByActiveApplicationException when an active application still references this CV', async () => {
    cvRepository.findById.mockResolvedValue(makeCv());
    cvRepository.hasActiveApplicationReference.mockResolvedValue(true);
    await expect(
      handler.execute(new DeleteCvCommand('candidate-1', 'cv-1')),
    ).rejects.toThrow(CvReferencedByActiveApplicationException);
    expect(cvRepository.update).not.toHaveBeenCalled();
  });

  it('soft-deletes the CV when the owner has no active application referencing it', async () => {
    const cv = makeCv();
    cvRepository.findById.mockResolvedValue(cv);
    cvRepository.hasActiveApplicationReference.mockResolvedValue(false);

    await handler.execute(new DeleteCvCommand('candidate-1', 'cv-1'));

    expect(cvRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({ deletedAt: expect.any(Date) }),
    );
  });
});
