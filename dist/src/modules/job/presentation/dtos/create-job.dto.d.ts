import { JobType } from '@/modules/job/domain/value-objects/job-type.vo';
export declare class CreateJobDto {
    title: string;
    description: string;
    company: string;
    location: string;
    jobType?: JobType;
    salaryMin?: number;
    salaryMax?: number;
    currency?: string;
    requirements?: string;
    benefits?: string;
    expiresAt?: string;
}
