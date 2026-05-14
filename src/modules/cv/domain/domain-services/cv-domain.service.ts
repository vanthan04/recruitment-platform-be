import { Cv } from '@/modules/cv/domain/entities/cv.entity';
import { BusinessRuleViolationException } from '@/common/exceptions/domain.exception';

/**
 * CV Domain Service.
 * Handles business logic that spans across multiple entities
 * or doesn't naturally belong to a single entity.
 * Framework-agnostic — no NestJS or Prisma imports.
 */
export class CvDomainService {
  /**
   * Validate that a CV is ready for job application.
   * Must be published and have required sections.
   */
  static validateForApplication(cv: Cv): void {
    if (!cv.isPublished) {
      throw new BusinessRuleViolationException(
        'Only published CVs can be used for job applications',
      );
    }

    if (cv.isDeleted) {
      throw new BusinessRuleViolationException(
        'Deleted CVs cannot be used for job applications',
      );
    }
  }

  /**
   * Check if CV has minimum completeness for publishing.
   */
  static isReadyForPublish(cv: Cv): { ready: boolean; reasons: string[] } {
    const reasons: string[] = [];

    if (!cv.title || cv.title.trim().length === 0) {
      reasons.push('CV must have a title');
    }

    if (cv.experiences.length === 0 && cv.educations.length === 0) {
      reasons.push('CV must have at least one experience or education');
    }

    return {
      ready: reasons.length === 0,
      reasons,
    };
  }
}
