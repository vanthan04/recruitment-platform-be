import { Cv } from '@/modules/cv/domain/entities/cv.entity';
import { Experience } from '@/modules/cv/domain/entities/experience.entity';
import { Skill } from '@/modules/cv/domain/entities/skill.entity';
import { CvStatus } from '@/modules/cv/domain/value-objects/cv-status.vo';
import { DateRange } from '@/modules/cv/domain/value-objects/date-range.vo';
import {
  BusinessRuleViolationException,
  UnauthorizedDomainException,
} from '@/common/exceptions/domain.exception';

function makeCv(overrides: Partial<Cv> = {}): Cv {
  return new Cv({
    title: 'My CV',
    summary: null,
    userId: 'user-1',
    ...overrides,
  });
}

function makeExperience(): Experience {
  return new Experience({
    company: 'Acme',
    position: 'Engineer',
    description: null,
    dateRange: new DateRange(new Date('2020-01-01')),
    cvId: 'cv-1',
  });
}

describe('Cv entity', () => {
  describe('publish', () => {
    it('throws when the CV has no experience or education', () => {
      const cv = makeCv();
      expect(() => cv.publish()).toThrow(BusinessRuleViolationException);
    });

    it('publishes when the CV has at least one experience', () => {
      const cv = makeCv({ experiences: [makeExperience()] });
      cv.publish();
      expect(cv.status).toBe(CvStatus.PUBLISHED);
      expect(cv.publishedAt).toBeInstanceOf(Date);
    });

    it('throws when publishing an already-published CV', () => {
      const cv = makeCv({ experiences: [makeExperience()] });
      cv.publish();
      expect(() => cv.publish()).toThrow(BusinessRuleViolationException);
    });
  });

  describe('softDelete', () => {
    it('marks the CV as deleted and reverts it to draft', () => {
      const cv = makeCv({ experiences: [makeExperience()] });
      cv.publish();
      cv.softDelete();
      expect(cv.isDeleted).toBe(true);
      expect(cv.status).toBe(CvStatus.DRAFT);
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

  describe('addSkill', () => {
    it('adds a skill', () => {
      const cv = makeCv();
      cv.addSkill(
        new Skill({ name: 'TypeScript', level: 'Advanced', cvId: 'cv-1' }),
      );
      expect(cv.skills).toHaveLength(1);
    });

    it('throws when adding a duplicate skill name (case-insensitive)', () => {
      const cv = makeCv();
      cv.addSkill(new Skill({ name: 'TypeScript', level: null, cvId: 'cv-1' }));
      expect(() =>
        cv.addSkill(
          new Skill({ name: 'typescript', level: null, cvId: 'cv-1' }),
        ),
      ).toThrow(BusinessRuleViolationException);
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
