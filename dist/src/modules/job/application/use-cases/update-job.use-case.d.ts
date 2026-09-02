import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { ICategoryRepository } from '@/modules/category/domain/repositories/category.repository';
import { JobResponseDto } from '@/modules/job/application/dto/job-response.dto';
export interface UpdateJobInput {
    title?: string;
    description?: string;
    location?: string;
    jobType?: string;
    level?: string;
    categoryId?: string | null;
    salaryMin?: number;
    salaryMax?: number;
    currency?: string;
    requirements?: string;
    benefits?: string;
    expiresAt?: string;
}
export declare class UpdateJobUseCase {
    private readonly jobRepository;
    private readonly categoryRepository;
    constructor(jobRepository: IJobRepository, categoryRepository: ICategoryRepository);
    execute(recruiterId: string, jobId: string, input: UpdateJobInput): Promise<JobResponseDto>;
}
