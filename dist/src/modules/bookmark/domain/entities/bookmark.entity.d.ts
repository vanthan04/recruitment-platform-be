import { BaseEntity } from '@/common/domain/base.entity';
export declare class Bookmark extends BaseEntity {
    userId: string;
    jobId: string;
    constructor(partial: Partial<Bookmark>);
}
