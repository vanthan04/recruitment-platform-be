import { Cv } from '@/modules/cv/domain/entities/cv.entity';
import { CvStatus } from '@/modules/cv/domain/value-objects/cv-status.vo';
import { CvFileType } from '@/modules/cv/domain/value-objects/cv-file-type.vo';
import {
  BusinessRuleViolationException,
  UnauthorizedDomainException,
} from '@/common/exceptions/domain.exception';

function makeCv(overrides: Partial<Cv> = {}): Cv {
  return new Cv({
    title: 'My CV',
    originalName: 'my-cv.pdf',
    fileType: CvFileType.PDF,
    mimeType: 'application/pdf',
    fileSize: 12345,
    fileKey: 'cvs/user-1/2026/09/cv-1.pdf',
    userId: 'user-1',
    ...overrides,
  });
}

describe('Cv entity', () => {
  it('defaults to PUBLISHED status on creation', () => {
    const cv = makeCv();
    expect(cv.status).toBe(CvStatus.PUBLISHED);
  });

  describe('publish / unpublish', () => {
    it('throws when publishing an already-published CV', () => {
      const cv = makeCv();
      expect(() => cv.publish()).toThrow(BusinessRuleViolationException);
    });

    it('unpublishes a published CV back to draft', () => {
      const cv = makeCv();
      cv.unpublish();
      expect(cv.status).toBe(CvStatus.DRAFT);
    });

    it('publishes a draft CV', () => {
      const cv = makeCv({ status: CvStatus.DRAFT });
      cv.publish();
      expect(cv.status).toBe(CvStatus.PUBLISHED);
    });

    it('throws when unpublishing an already-draft CV', () => {
      const cv = makeCv({ status: CvStatus.DRAFT });
      expect(() => cv.unpublish()).toThrow(BusinessRuleViolationException);
    });
  });

  describe('softDelete', () => {
    it('marks the CV as deleted', () => {
      const cv = makeCv();
      cv.softDelete();
      expect(cv.isDeleted).toBe(true);
    });

    it('throws when deleting an already-deleted CV', () => {
      const cv = makeCv();
      cv.softDelete();
      expect(() => cv.softDelete()).toThrow(BusinessRuleViolationException);
    });
  });

  describe('ensureOwner', () => {
    it('does not throw when the userId matches the owner', () => {
      const cv = makeCv({ userId: 'user-1' });
      expect(() => cv.ensureOwner('user-1')).not.toThrow();
    });

    it('throws UnauthorizedDomainException when the userId does not match', () => {
      const cv = makeCv({ userId: 'user-1' });
      expect(() => cv.ensureOwner('someone-else')).toThrow(
        UnauthorizedDomainException,
      );
    });
  });

  describe('updateTitle', () => {
    it('trims and updates the title', () => {
      const cv = makeCv();
      cv.updateTitle('  New Title  ');
      expect(cv.title).toBe('New Title');
    });

    it('throws when the title is empty', () => {
      const cv = makeCv();
      expect(() => cv.updateTitle('   ')).toThrow(
        BusinessRuleViolationException,
      );
    });
  });
});
