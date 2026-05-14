import { Cv } from '@/modules/cv/domain/entities/cv.entity';
export declare abstract class ICvRepository {
    abstract findById(id: string): Promise<Cv | null>;
    abstract findByIdWithRelations(id: string): Promise<Cv | null>;
    abstract findAllByUserId(userId: string): Promise<Cv[]>;
    abstract save(cv: Cv): Promise<Cv>;
    abstract update(cv: Cv): Promise<Cv>;
    abstract delete(id: string): Promise<void>;
    abstract softDelete(id: string): Promise<void>;
}
