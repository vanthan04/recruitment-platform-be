import { IJobApplicationRepository } from '@/modules/application/domain/repositories/job-application.repository';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { ApplicationResponseDto } from '@/modules/application/application/dto/application-response.dto';
export declare class ListApplicationsByJobUseCase {
    private readonly applicationRepository;
    private readonly jobRepository;
    constructor(applicationRepository: IJobApplicationRepository, jobRepository: IJobRepository);
    execute(recruiterId: string, jobId: string): Promise<ApplicationResponseDto[]>;
}
