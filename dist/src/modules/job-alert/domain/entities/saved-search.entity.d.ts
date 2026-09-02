import { BaseEntity } from '@/common/domain/base.entity';
import { JobType } from '@/modules/job/domain/value-objects/job-type.vo';
export declare class SavedSearch extends BaseEntity {
    userId: string;
    keyword: string | null;
    location: string | null;
    categoryId: string | null;
    jobType: JobType | null;
    constructor(partial: Partial<SavedSearch>);
}
