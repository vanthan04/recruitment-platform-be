import { Job } from '@/modules/job/domain/entities/job.entity';
export declare class JobMapper {
    static toDomain(raw: any): Job | null;
    static toPersistence(job: Job): any;
}
