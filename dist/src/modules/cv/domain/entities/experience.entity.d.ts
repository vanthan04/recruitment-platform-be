import { BaseEntity } from '@/common/domain/base.entity';
import { DateRange } from '@/modules/cv/domain/value-objects/date-range.vo';
export declare class Experience extends BaseEntity {
    company: string;
    position: string;
    description: string | null;
    dateRange: DateRange;
    cvId: string;
    constructor(partial: Partial<Experience>);
    get isCurrent(): boolean;
}
