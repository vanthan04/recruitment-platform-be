import { IJobApplicationRepository } from '@/modules/application/domain/repositories/job-application.repository';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { ICvRepository } from '@/modules/cv/domain/repositories/cv.repository';
import { ApplicationResponseDto } from '@/modules/application/application/dto/application-response.dto';
export interface ApplyJobInput {
    jobId: string;
    cvId: string;
    coverLetter?: string;
}
export declare class ApplyJobUseCase {
    private readonly applicationRepository;
    private readonly jobRepository;
    private readonly cvRepository;
    constructor(applicationRepository: IJobApplicationRepository, jobRepository: IJobRepository, cvRepository: ICvRepository);
    execute(userId: string, input: ApplyJobInput): Promise<ApplicationResponseDto>;
}
