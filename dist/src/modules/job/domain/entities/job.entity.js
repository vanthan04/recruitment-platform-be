"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Job = void 0;
const base_entity_1 = require("../../../../common/domain/base.entity");
const job_status_vo_1 = require("../value-objects/job-status.vo");
const job_type_vo_1 = require("../value-objects/job-type.vo");
const salary_range_vo_1 = require("../value-objects/salary-range.vo");
const domain_exception_1 = require("../../../../common/exceptions/domain.exception");
class Job extends base_entity_1.BaseEntity {
    title;
    description;
    companyId;
    company;
    categoryId;
    category;
    location;
    jobType;
    level;
    status;
    viewCount;
    salary;
    requirements;
    benefits;
    expiresAt;
    deletedAt;
    postedById;
    constructor(partial) {
        super();
        Object.assign(this, partial);
        this.status = partial.status ?? job_status_vo_1.JobStatus.DRAFT;
        this.jobType = partial.jobType ?? job_type_vo_1.JobType.FULL_TIME;
        this.level = partial.level ?? null;
        this.categoryId = partial.categoryId ?? null;
        this.viewCount = partial.viewCount ?? 0;
        this.deletedAt = partial.deletedAt ?? null;
    }
    open() {
        if (this.status === job_status_vo_1.JobStatus.OPEN) {
            throw new domain_exception_1.BusinessRuleViolationException('Job is already open');
        }
        this.status = job_status_vo_1.JobStatus.OPEN;
    }
    close() {
        if (this.status === job_status_vo_1.JobStatus.CLOSED) {
            throw new domain_exception_1.BusinessRuleViolationException('Job is already closed');
        }
        this.status = job_status_vo_1.JobStatus.CLOSED;
    }
    reopen() {
        if (this.status !== job_status_vo_1.JobStatus.CLOSED) {
            throw new domain_exception_1.BusinessRuleViolationException('Only closed jobs can be reopened');
        }
        this.status = job_status_vo_1.JobStatus.OPEN;
    }
    softDelete() {
        if (this.deletedAt) {
            throw new domain_exception_1.BusinessRuleViolationException('Job is already deleted');
        }
        this.deletedAt = new Date();
        this.status = job_status_vo_1.JobStatus.CLOSED;
    }
    ensureOwner(userId) {
        if (this.postedById !== userId) {
            throw new domain_exception_1.UnauthorizedDomainException('You are not the owner of this job posting');
        }
    }
    get isExpired() {
        if (!this.expiresAt)
            return false;
        return this.expiresAt < new Date();
    }
    get isOpen() {
        return this.status === job_status_vo_1.JobStatus.OPEN && !this.isExpired && !this.deletedAt;
    }
    get isDeleted() {
        return this.deletedAt !== null;
    }
    belongsTo(userId) {
        return this.postedById === userId;
    }
    updateDetails(data) {
        if (data.title)
            this.title = data.title;
        if (data.description)
            this.description = data.description;
        if (data.location)
            this.location = data.location;
        if (data.jobType)
            this.jobType = data.jobType;
        if (data.level !== undefined)
            this.level = data.level;
        if (data.categoryId !== undefined)
            this.categoryId = data.categoryId;
        if (data.requirements !== undefined)
            this.requirements = data.requirements;
        if (data.benefits !== undefined)
            this.benefits = data.benefits;
        if (data.expiresAt !== undefined)
            this.expiresAt = data.expiresAt;
        if (data.salaryMin !== undefined || data.salaryMax !== undefined || data.currency !== undefined) {
            this.salary = new salary_range_vo_1.SalaryRange(data.salaryMin ?? this.salary?.min ?? null, data.salaryMax ?? this.salary?.max ?? null, data.currency ?? this.salary?.currency ?? 'VND');
        }
    }
}
exports.Job = Job;
//# sourceMappingURL=job.entity.js.map