import { PurgeDeletedCvsHandler } from './purge-deleted-cvs.command';
import { ICvRepository } from '@/modules/cv/domain/repositories/cv.repository';
import { ICvStoragePort } from '@/modules/cv/application/ports/cv-storage.port';
import { Cv } from '@/modules/cv/domain/entities/cv.entity';
import { CvFileType } from '@/modules/cv/domain/value-objects/cv-file-type.vo';

function makeDeletedCv(overrides: Partial<Cv> = {}): Cv {
  return new Cv({
    id: 'cv-1',
    title: 'Old CV',
    originalName: 'old.pdf',
    fileType: CvFileType.PDF,
    mimeType: 'application/pdf',
    fileSize: 1024,
    fileKey: 'cvs/user-1/2026/01/cv-1.pdf',
    userId: 'user-1',
    deletedAt: new Date('2026-01-01'),
    ...overrides,
  });
}

describe('PurgeDeletedCvsHandler', () => {
  let cvRepository: jest.Mocked<ICvRepository>;
  let cvStorage: jest.Mocked<ICvStoragePort>;
  let handler: PurgeDeletedCvsHandler;

  beforeEach(() => {
    cvRepository = {
      findById: jest.fn(),
      findAllByUserId: jest.fn(),
      findSoftDeletedBefore: jest.fn().mockResolvedValue([]),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      softDelete: jest.fn(),
      hasRecruiterAccess: jest.fn(),
      hasActiveApplicationReference: jest.fn(),
    };
    cvStorage = {
      upload: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
      getDownloadUrl: jest.fn(),
      downloadBuffer: jest.fn(),
    };
    handler = new PurgeDeletedCvsHandler(cvRepository, cvStorage);
  });

  it('does nothing when there are no soft-deleted CVs past the retention window', async () => {
    await handler.execute();

    expect(cvStorage.delete).not.toHaveBeenCalled();
    expect(cvRepository.delete).not.toHaveBeenCalled();
  });

  it('deletes the S3 object and hard-deletes the DB row for each candidate', async () => {
    cvRepository.findSoftDeletedBefore.mockResolvedValue([
      makeDeletedCv({ id: 'cv-1', fileKey: 'cvs/user-1/2026/01/cv-1.pdf' }),
      makeDeletedCv({ id: 'cv-2', fileKey: 'cvs/user-2/2026/01/cv-2.pdf' }),
    ]);

    await handler.execute();

    expect(cvStorage.delete).toHaveBeenCalledWith(
      'cvs/user-1/2026/01/cv-1.pdf',
    );
    expect(cvStorage.delete).toHaveBeenCalledWith(
      'cvs/user-2/2026/01/cv-2.pdf',
    );
    expect(cvRepository.delete).toHaveBeenCalledWith('cv-1');
    expect(cvRepository.delete).toHaveBeenCalledWith('cv-2');
  });

  it('still hard-deletes the DB row when the S3 object is already gone (best-effort cleanup)', async () => {
    cvRepository.findSoftDeletedBefore.mockResolvedValue([makeDeletedCv()]);
    cvStorage.delete.mockRejectedValue(new Error('NoSuchKey'));

    await handler.execute();

    expect(cvRepository.delete).toHaveBeenCalledWith('cv-1');
  });

  it('continues purging subsequent CVs after one fails entirely (per-item isolation)', async () => {
    cvRepository.findSoftDeletedBefore.mockResolvedValue([
      makeDeletedCv({ id: 'cv-1' }),
      makeDeletedCv({ id: 'cv-2' }),
    ]);
    cvRepository.delete
      .mockRejectedValueOnce(new Error('DB connection lost'))
      .mockResolvedValueOnce(undefined);

    await expect(handler.execute()).resolves.toBeUndefined();

    expect(cvRepository.delete).toHaveBeenCalledTimes(2);
  });
});
