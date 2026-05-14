import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { JobResponseDto } from '@/modules/job/application/dto/job-response.dto';
export interface UpdateJobInput {
    title?: string;
    description?: string;
    company?: string;
    location?: string;
    jobType?: string;
    salaryMin?: number;
    salaryMax?: number;
    currency?: string;
    requirements?: string;
    benefits?: string;
    expiresAt?: string;
}
export declare class UpdateJobUseCase {
    private readonly jobRepository;
    constructor(jobRepository: IJobRepository);
    execute(recruiterId: string, jobId: string, input: UpdateJobInput): Promise<JobResponseDto>;
}
