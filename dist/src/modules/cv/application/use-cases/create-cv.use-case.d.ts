import { ICvRepository } from '@/modules/cv/domain/repositories/cv.repository';
import { CvResponseDto } from '@/modules/cv/application/dto/cv-response.dto';
export interface CreateCvInput {
    title: string;
    summary?: string;
    experiences?: {
        company: string;
        position: string;
        description?: string;
        startDate: Date;
        endDate?: Date;
        isCurrent?: boolean;
    }[];
    educations?: {
        school: string;
        degree: string;
        fieldOfStudy?: string;
        description?: string;
        startDate: Date;
        endDate?: Date;
    }[];
    skills?: {
        name: string;
        level?: string;
    }[];
}
export declare class CreateCvUseCase {
    private readonly cvRepository;
    constructor(cvRepository: ICvRepository);
    execute(userId: string, input: CreateCvInput): Promise<CvResponseDto>;
}
