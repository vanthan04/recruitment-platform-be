import { Cv } from '@/modules/cv/domain/entities/cv.entity';

/**
 * CV Repository interface (port).
 * Defined in the domain layer — implementation lives in infrastructure.
 * Uses abstract class for NestJS DI compatibility.
 */
export abstract class ICvRepository {
  abstract findById(id: string): Promise<Cv | null>;
  abstract findByIdWithRelations(id: string): Promise<Cv | null>;
  abstract findAllByUserId(userId: string): Promise<Cv[]>;
  abstract save(cv: Cv): Promise<Cv>;
  abstract update(cv: Cv): Promise<Cv>;
  abstract delete(id: string): Promise<void>;
  abstract softDelete(id: string): Promise<void>;
}
