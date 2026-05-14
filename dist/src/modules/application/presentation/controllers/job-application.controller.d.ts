import { ApplyJobUseCase } from '@/modules/application/application/use-cases/apply-job.use-case';
import { UpdateApplicationStatusUseCase } from '@/modules/application/application/use-cases/update-application-status.use-case';
import { ListMyApplicationsUseCase } from '@/modules/application/application/use-cases/list-my-applications.use-case';
import { ListApplicationsByJobUseCase } from '@/modules/application/application/use-cases/list-applications-by-job.use-case';
import { ApplyJobDto } from '@/modules/application/presentation/dtos/apply-job.dto';
import { UpdateApplicationStatusDto } from '@/modules/application/presentation/dtos/update-application-status.dto';
export declare class JobApplicationController {
    private readonly applyJobUseCase;
    private readonly updateStatusUseCase;
    private readonly listMyAppsUseCase;
    private readonly listByJobUseCase;
    constructor(applyJobUseCase: ApplyJobUseCase, updateStatusUseCase: UpdateApplicationStatusUseCase, listMyAppsUseCase: ListMyApplicationsUseCase, listByJobUseCase: ListApplicationsByJobUseCase);
    apply(userId: string, dto: ApplyJobDto): Promise<import("../../../../common/dtos/response.dto").ResponseDto<import("../../application/dto/application-response.dto").ApplicationResponseDto>>;
    listMyApplications(userId: string): Promise<import("../../../../common/dtos/response.dto").ResponseDto<import("../../application/dto/application-response.dto").ApplicationResponseDto>>;
    listByJob(recruiterId: string, jobId: string): Promise<import("../../../../common/dtos/response.dto").ResponseDto<import("../../application/dto/application-response.dto").ApplicationResponseDto>>;
    updateStatus(recruiterId: string, id: string, dto: UpdateApplicationStatusDto): Promise<import("../../../../common/dtos/response.dto").ResponseDto<import("../../application/dto/application-response.dto").ApplicationResponseDto>>;
}
