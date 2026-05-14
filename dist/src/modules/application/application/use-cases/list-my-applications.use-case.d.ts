import { IJobApplicationRepository } from '@/modules/application/domain/repositories/job-application.repository';
import { ApplicationResponseDto } from '@/modules/application/application/dto/application-response.dto';
export declare class ListMyApplicationsUseCase {
    private readonly applicationRepository;
    constructor(applicationRepository: IJobApplicationRepository);
    execute(userId: string): Promise<ApplicationResponseDto[]>;
}
