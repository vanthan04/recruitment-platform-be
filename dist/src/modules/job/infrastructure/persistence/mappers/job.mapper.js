"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobMapper = void 0;
const job_entity_1 = require("../../../domain/entities/job.entity");
const salary_range_vo_1 = require("../../../domain/value-objects/salary-range.vo");
class JobMapper {
    static toDomain(raw) {
        if (!raw)
            return null;
        return new job_entity_1.Job({
            id: raw.id,
            title: raw.title,
            description: raw.description,
            company: raw.company,
            location: raw.location,
            jobType: raw.jobType,
            status: raw.status,
            salary: new salary_range_vo_1.SalaryRange(raw.salaryMin, raw.salaryMax, raw.currency),
            requirements: raw.requirements,
            benefits: raw.benefits,
            expiresAt: raw.expiresAt,
            postedById: raw.postedById,
            createdAt: raw.createdAt,
            updatedAt: raw.updatedAt,
            deletedAt: raw.deletedAt,
        });
    }
    static toPersistence(job) {
        return {
            title: job.title,
            description: job.description,
            company: job.company,
            location: job.location,
            jobType: job.jobType,
            status: job.status,
            salaryMin: job.salary?.min,
            salaryMax: job.salary?.max,
            currency: job.salary?.currency,
            requirements: job.requirements,
            benefits: job.benefits,
            expiresAt: job.expiresAt,
            postedById: job.postedById,
            deletedAt: job.deletedAt,
        };
    }
}
exports.JobMapper = JobMapper;
//# sourceMappingURL=job.mapper.js.map