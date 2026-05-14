import { Job } from '@/modules/job/domain/entities/job.entity';
import { JobResponseDto } from '@/modules/job/application/dto/job-response.dto';
export declare class JobResponseMapper {
    static toDto(job: Job): JobResponseDto;
    static toDtoList(jobs: Job[]): JobResponseDto[];
}
