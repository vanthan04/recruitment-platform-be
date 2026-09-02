import { JobType } from '@/modules/job/domain/value-objects/job-type.vo';
import { JobLevel } from '@/modules/job/domain/value-objects/job-level.vo';
export declare class CreateJobDto {
    title: string;
    description: string;
    location: string;
    jobType?: JobType;
    level?: JobLevel;
    categoryId?: string;
    salaryMin?: number;
    salaryMax?: number;
    currency?: string;
    requirements?: string;
    benefits?: string;
    expiresAt?: string;
}
