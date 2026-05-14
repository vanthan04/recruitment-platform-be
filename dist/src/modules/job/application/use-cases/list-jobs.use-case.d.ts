import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { JobResponseDto } from '@/modules/job/application/dto/job-response.dto';
export interface ListJobsInput {
    page: number;
    limit: number;
    keyword?: string;
    location?: string;
    jobType?: string;
    salaryMin?: number;
    salaryMax?: number;
}
export declare class ListJobsUseCase {
    private readonly jobRepository;
    constructor(jobRepository: IJobRepository);
    execute(input: ListJobsInput): Promise<{
        jobs: JobResponseDto[];
        total: number;
        page: number;
        limit: number;
    }>;
}
