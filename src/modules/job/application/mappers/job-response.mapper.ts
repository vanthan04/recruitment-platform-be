import { Job } from '@/modules/job/domain/entities/job.entity';
import { JobResponseDto } from '@/modules/job/application/dto/job-response.dto';

/**
 * Maps Job domain entity to response DTO.
 */
export class JobResponseMapper {
  static toDto(job: Job): JobResponseDto {
    const dto = new JobResponseDto();
    dto.id = job.id;
    dto.title = job.title;
    dto.description = job.description;
    dto.companyId = job.companyId;
    dto.company = job.company ?? null;
    dto.categoryId = job.categoryId;
    dto.category = job.category ?? null;
    dto.location = job.location;
    dto.jobType = job.jobType;
    dto.level = job.level;
    dto.status = job.status;
    dto.viewCount = job.viewCount;
    dto.salaryMin = job.salary?.min ?? null;
    dto.salaryMax = job.salary?.max ?? null;
    dto.currency = job.salary?.currency ?? 'VND';
    dto.requirements = job.requirements;
    dto.benefits = job.benefits;
    dto.extraInfo = job.extraInfo;
    dto.expiresAt = job.expiresAt;
    dto.postedById = job.postedById;
    dto.createdAt = job.createdAt;
    dto.updatedAt = job.updatedAt;
    return dto;
  }

  static toDtoList(jobs: Job[]): JobResponseDto[] {
    return jobs.map(JobResponseMapper.toDto);
  }
}
