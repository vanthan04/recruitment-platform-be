import { ICvRepository } from '@/modules/cv/domain/repositories/cv.repository';
import { CvResponseDto } from '@/modules/cv/application/dto/cv-response.dto';
export declare class PublishCvUseCase {
    private readonly cvRepository;
    constructor(cvRepository: ICvRepository);
    execute(userId: string, cvId: string): Promise<CvResponseDto>;
}
