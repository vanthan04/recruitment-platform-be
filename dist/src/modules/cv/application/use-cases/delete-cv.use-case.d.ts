import { ICvRepository } from '@/modules/cv/domain/repositories/cv.repository';
export declare class DeleteCvUseCase {
    private readonly cvRepository;
    constructor(cvRepository: ICvRepository);
    execute(userId: string, cvId: string): Promise<void>;
}
