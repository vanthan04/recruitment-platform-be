import { EventEmitter2 } from '@nestjs/event-emitter';
import { IJobApplicationRepository } from '@/modules/application/domain/repositories/job-application.repository';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { ApplicationResponseDto } from '@/modules/application/application/dto/application-response.dto';
import { ApplicationStatus } from '@/modules/application/domain/value-objects/application-status.vo';
export declare class UpdateApplicationStatusUseCase {
    private readonly applicationRepository;
    private readonly jobRepository;
    private readonly eventEmitter;
    constructor(applicationRepository: IJobApplicationRepository, jobRepository: IJobRepository, eventEmitter: EventEmitter2);
    execute(recruiterId: string, applicationId: string, status: ApplicationStatus): Promise<ApplicationResponseDto>;
}
