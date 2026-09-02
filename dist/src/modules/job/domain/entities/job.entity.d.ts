import { BaseEntity } from '@/common/domain/base.entity';
import { JobStatus } from '@/modules/job/domain/value-objects/job-status.vo';
import { JobType } from '@/modules/job/domain/value-objects/job-type.vo';
import { JobLevel } from '@/modules/job/domain/value-objects/job-level.vo';
import { SalaryRange } from '@/modules/job/domain/value-objects/salary-range.vo';
export interface CompanySummary {
    id: string;
    name: string;
    logoUrl: string | null;
}
export interface CategorySummary {
    id: string;
    name: string;
    slug: string;
}
export declare class Job extends BaseEntity {
    title: string;
    description: string;
    companyId: string;
    company?: CompanySummary | null;
    categoryId: string | null;
    category?: CategorySummary | null;
    location: string;
    jobType: JobType;
    level: JobLevel | null;
    status: JobStatus;
    viewCount: number;
    salary: SalaryRange;
    requirements: string | null;
    benefits: string | null;
    expiresAt: Date | null;
    deletedAt: Date | null;
    postedById: string;
    constructor(partial: Partial<Job>);
    open(): void;
    close(): void;
    reopen(): void;
    softDelete(): void;
    ensureOwner(userId: string): void;
    get isExpired(): boolean;
    get isOpen(): boolean;
    get isDeleted(): boolean;
    belongsTo(userId: string): boolean;
    updateDetails(data: {
        title?: string;
        description?: string;
        location?: string;
        jobType?: JobType;
        level?: JobLevel | null;
        categoryId?: string | null;
        requirements?: string;
        benefits?: string;
        salaryMin?: number;
        salaryMax?: number;
        currency?: string;
        expiresAt?: Date;
    }): void;
}
