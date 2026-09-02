import { BaseEntity } from '@/common/domain/base.entity';
import { ApplicationStatus } from '@/modules/application/domain/value-objects/application-status.vo';
export declare class JobApplication extends BaseEntity {
    status: ApplicationStatus;
    coverLetter: string | null;
    userId: string;
    jobId: string;
    cvId: string;
    constructor(partial: Partial<JobApplication>);
    accept(): void;
    reject(): void;
    withdraw(): void;
    isPending(): boolean;
}
