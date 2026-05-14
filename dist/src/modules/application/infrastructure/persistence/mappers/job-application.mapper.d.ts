import { JobApplication } from '@/modules/application/domain/entities/job-application.entity';
export declare class JobApplicationMapper {
    static toDomain(raw: any): JobApplication | null;
    static toPersistence(app: JobApplication): any;
}
