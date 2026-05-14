import { CreateJobUseCase } from '@/modules/job/application/use-cases/create-job.use-case';
import { UpdateJobUseCase } from '@/modules/job/application/use-cases/update-job.use-case';
import { ListJobsUseCase } from '@/modules/job/application/use-cases/list-jobs.use-case';
import { GetJobUseCase } from '@/modules/job/application/use-cases/get-job.use-case';
import { DeleteJobUseCase } from '@/modules/job/application/use-cases/delete-job.use-case';
import { CreateJobDto } from '@/modules/job/presentation/dtos/create-job.dto';
import { UpdateJobDto } from '@/modules/job/presentation/dtos/update-job.dto';
import { SearchJobDto } from '@/modules/job/presentation/dtos/search-job.dto';
export declare class JobController {
    private readonly createJobUseCase;
    private readonly updateJobUseCase;
    private readonly listJobsUseCase;
    private readonly getJobUseCase;
    private readonly deleteJobUseCase;
    constructor(createJobUseCase: CreateJobUseCase, updateJobUseCase: UpdateJobUseCase, listJobsUseCase: ListJobsUseCase, getJobUseCase: GetJobUseCase, deleteJobUseCase: DeleteJobUseCase);
    create(recruiterId: string, dto: CreateJobDto): Promise<import("../../../../common/dtos/response.dto").ResponseDto<import("../../application/dto/job-response.dto").JobResponseDto>>;
    list(query: SearchJobDto): Promise<import("../../../../common/dtos/response.dto").ResponseDto<import("../../application/dto/job-response.dto").JobResponseDto>>;
    getById(id: string): Promise<import("../../../../common/dtos/response.dto").ResponseDto<import("../../application/dto/job-response.dto").JobResponseDto>>;
    update(recruiterId: string, jobId: string, dto: UpdateJobDto): Promise<import("../../../../common/dtos/response.dto").ResponseDto<import("../../application/dto/job-response.dto").JobResponseDto>>;
    delete(recruiterId: string, jobId: string): Promise<void>;
}
