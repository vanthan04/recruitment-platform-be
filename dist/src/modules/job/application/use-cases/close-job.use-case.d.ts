import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { JobResponseDto } from '@/modules/job/application/dto/job-response.dto';
export declare class CloseJobUseCase {
    private readonly jobRepository;
    constructor(jobRepository: IJobRepository);
    execute(recruiterId: string, jobId: string): Promise<JobResponseDto>;
}
