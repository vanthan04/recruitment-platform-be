import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';
import { ICategoryRepository } from '@/modules/category/domain/repositories/category.repository';
import { JobResponseDto } from '@/modules/job/application/dto/job-response.dto';
export interface CreateJobInput {
    title: string;
    description: string;
    location: string;
    jobType?: string;
    level?: string;
    categoryId?: string;
    salaryMin?: number;
    salaryMax?: number;
    currency?: string;
    requirements?: string;
    benefits?: string;
    expiresAt?: string;
}
export declare class CreateJobUseCase {
    private readonly jobRepository;
    private readonly userRepository;
    private readonly categoryRepository;
    constructor(jobRepository: IJobRepository, userRepository: IUserRepository, categoryRepository: ICategoryRepository);
    execute(recruiterId: string, input: CreateJobInput): Promise<JobResponseDto>;
}
