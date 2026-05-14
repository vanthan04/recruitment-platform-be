import { IJobApplicationRepository } from '@/modules/application/domain/repositories/job-application.repository';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { ApplicationResponseDto } from '@/modules/application/application/dto/application-response.dto';
import { ApplicationStatus } from '@/modules/application/domain/value-objects/application-status.vo';
export declare class UpdateApplicationStatusUseCase {
    private readonly applicationRepository;
    private readonly jobRepository;
    constructor(applicationRepository: IJobApplicationRepository, jobRepository: IJobRepository);
    execute(recruiterId: string, applicationId: string, status: ApplicationStatus): Promise<ApplicationResponseDto>;
}
