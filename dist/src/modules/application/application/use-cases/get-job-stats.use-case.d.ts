import { IJobApplicationRepository } from '@/modules/application/domain/repositories/job-application.repository';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { JobStatsResponseDto } from '@/modules/application/application/dto/job-stats-response.dto';
export declare class GetJobStatsUseCase {
    private readonly applicationRepository;
    private readonly jobRepository;
    constructor(applicationRepository: IJobApplicationRepository, jobRepository: IJobRepository);
    execute(recruiterId: string, jobId: string): Promise<JobStatsResponseDto>;
}
