import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
export declare class DeleteJobUseCase {
    private readonly jobRepository;
    constructor(jobRepository: IJobRepository);
    execute(recruiterId: string, jobId: string): Promise<void>;
}
