import { ISavedSearchRepository } from '@/modules/job-alert/domain/repositories/saved-search.repository';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';
import { IMailService } from '@/modules/mail/domain/ports/mail.service.port';
export declare class JobAlertDigestCron {
    private readonly savedSearchRepository;
    private readonly jobRepository;
    private readonly userRepository;
    private readonly mailService;
    private readonly logger;
    constructor(savedSearchRepository: ISavedSearchRepository, jobRepository: IJobRepository, userRepository: IUserRepository, mailService: IMailService);
    handleCron(): Promise<void>;
}
