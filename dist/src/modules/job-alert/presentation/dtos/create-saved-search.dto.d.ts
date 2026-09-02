import { JobType } from '@/modules/job/domain/value-objects/job-type.vo';
export declare class CreateSavedSearchDto {
    keyword?: string;
    location?: string;
    categoryId?: string;
    jobType?: JobType;
}
