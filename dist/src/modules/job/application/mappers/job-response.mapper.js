"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobResponseMapper = void 0;
const job_response_dto_1 = require("../dto/job-response.dto");
class JobResponseMapper {
    static toDto(job) {
        const dto = new job_response_dto_1.JobResponseDto();
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
        dto.expiresAt = job.expiresAt;
        dto.postedById = job.postedById;
        dto.createdAt = job.createdAt;
        dto.updatedAt = job.updatedAt;
        return dto;
    }
    static toDtoList(jobs) {
        return jobs.map(JobResponseMapper.toDto);
    }
}
exports.JobResponseMapper = JobResponseMapper;
//# sourceMappingURL=job-response.mapper.js.map