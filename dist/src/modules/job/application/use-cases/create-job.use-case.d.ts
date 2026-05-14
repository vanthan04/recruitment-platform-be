import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { JobResponseDto } from '@/modules/job/application/dto/job-response.dto';
export interface CreateJobInput {
    title: string;
    description: string;
    company: string;
    location: string;
    jobType?: string;
    salaryMin?: number;
    salaryMax?: number;
    currency?: string;
    requirements?: string;
    benefits?: string;
    expiresAt?: string;
}
export declare class CreateJobUseCase {
    private readonly jobRepository;
    constructor(jobRepository: IJobRepository);
    execute(recruiterId: string, input: CreateJobInput): Promise<JobResponseDto>;
}
