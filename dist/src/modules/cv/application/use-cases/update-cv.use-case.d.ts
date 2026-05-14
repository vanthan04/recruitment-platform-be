import { ICvRepository } from '@/modules/cv/domain/repositories/cv.repository';
import { CvResponseDto } from '@/modules/cv/application/dto/cv-response.dto';
export interface UpdateCvInput {
    title?: string;
    summary?: string;
    experiences?: {
        id?: string;
        company: string;
        position: string;
        description?: string;
        startDate: Date;
        endDate?: Date;
        isCurrent?: boolean;
    }[];
    educations?: {
        id?: string;
        school: string;
        degree: string;
        fieldOfStudy?: string;
        description?: string;
        startDate: Date;
        endDate?: Date;
    }[];
    skills?: {
        id?: string;
        name: string;
        level?: string;
    }[];
}
export declare class UpdateCvUseCase {
    private readonly cvRepository;
    constructor(cvRepository: ICvRepository);
    execute(userId: string, cvId: string, input: UpdateCvInput): Promise<CvResponseDto>;
}
