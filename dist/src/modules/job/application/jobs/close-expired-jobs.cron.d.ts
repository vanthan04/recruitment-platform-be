import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
export declare class CloseExpiredJobsCron {
    private readonly jobRepository;
    private readonly logger;
    constructor(jobRepository: IJobRepository);
    handleCron(): Promise<void>;
}
