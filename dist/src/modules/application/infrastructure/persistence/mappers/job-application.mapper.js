"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobApplicationMapper = void 0;
const job_application_entity_1 = require("../../../domain/entities/job-application.entity");
class JobApplicationMapper {
    static toDomain(raw) {
        if (!raw)
            return null;
        return new job_application_entity_1.JobApplication({
            id: raw.id,
            status: raw.status,
            coverLetter: raw.coverLetter,
            userId: raw.userId,
            jobId: raw.jobId,
            cvId: raw.cvId,
            createdAt: raw.createdAt,
            updatedAt: raw.updatedAt,
        });
    }
    static toPersistence(app) {
        return {
            status: app.status,
            coverLetter: app.coverLetter,
            userId: app.userId,
            jobId: app.jobId,
            cvId: app.cvId,
        };
    }
}
exports.JobApplicationMapper = JobApplicationMapper;
//# sourceMappingURL=job-application.mapper.js.map