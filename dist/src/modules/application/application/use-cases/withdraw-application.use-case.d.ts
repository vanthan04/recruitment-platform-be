import { IJobApplicationRepository } from '@/modules/application/domain/repositories/job-application.repository';
import { ApplicationResponseDto } from '@/modules/application/application/dto/application-response.dto';
export declare class WithdrawApplicationUseCase {
    private readonly applicationRepository;
    constructor(applicationRepository: IJobApplicationRepository);
    execute(userId: string, applicationId: string): Promise<ApplicationResponseDto>;
}
