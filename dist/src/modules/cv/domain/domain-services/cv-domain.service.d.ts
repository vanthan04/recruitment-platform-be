import { Cv } from '@/modules/cv/domain/entities/cv.entity';
export declare class CvDomainService {
    static validateForApplication(cv: Cv): void;
    static isReadyForPublish(cv: Cv): {
        ready: boolean;
        reasons: string[];
    };
}
