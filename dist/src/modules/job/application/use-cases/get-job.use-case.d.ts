import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { JobResponseDto } from '@/modules/job/application/dto/job-response.dto';
export declare class GetJobUseCase {
    private readonly jobRepository;
    constructor(jobRepository: IJobRepository);
    execute(jobId: string): Promise<JobResponseDto>;
}
