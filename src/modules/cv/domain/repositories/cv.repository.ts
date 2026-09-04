import { Cv } from '@/modules/cv/domain/entities/cv.entity';

/**
 * CV Repository interface (port).
 * Defined in the domain layer — implementation lives in infrastructure.
 * Uses abstract class for NestJS DI compatibility.
 */
export abstract class ICvRepository {
  abstract findById(id: string): Promise<Cv | null>;
  abstract findAllByUserId(userId: string): Promise<Cv[]>;
  abstract save(cv: Cv): Promise<Cv>;
  abstract update(cv: Cv): Promise<Cv>;
  abstract delete(id: string): Promise<void>;
  abstract softDelete(id: string): Promise<void>;

  /**
   * True if `recruiterId` posted a Job that a JobApplication referencing this
   * CV was submitted to (Recruiter -> Job -> JobApplication -> Cv chain).
   * Backing query spans the JobApplication/Job tables directly (same Prisma
   * schema, not a separate module's domain) — kept here rather than behind a
   * cross-module port to avoid a CvModule <-> JobApplicationModule import
   * cycle (JobApplicationModule already imports CvModule).
   */
  abstract hasRecruiterAccess(
    cvId: string,
    recruiterId: string,
  ): Promise<boolean>;
}
