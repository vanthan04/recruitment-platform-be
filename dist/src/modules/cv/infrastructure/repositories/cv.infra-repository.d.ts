import { ICvRepository } from '@/modules/cv/domain/repositories/cv.repository';
import { Cv } from '@/modules/cv/domain/entities/cv.entity';
import { CvPrismaRepository } from '@/modules/cv/infrastructure/persistence/prisma/cv-prisma.repository';
export declare class CvInfraRepository implements ICvRepository {
    private readonly cvPrisma;
    constructor(cvPrisma: CvPrismaRepository);
    findById(id: string): Promise<Cv | null>;
    findByIdWithRelations(id: string): Promise<Cv | null>;
    findAllByUserId(userId: string): Promise<Cv[]>;
    save(cv: Cv): Promise<Cv>;
    update(cv: Cv): Promise<Cv>;
    delete(id: string): Promise<void>;
    softDelete(id: string): Promise<void>;
}
