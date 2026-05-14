import { BaseEntity } from '@/common/domain/base.entity';
import { DateRange } from '@/modules/cv/domain/value-objects/date-range.vo';
export declare class Education extends BaseEntity {
    school: string;
    degree: string;
    fieldOfStudy: string | null;
    description: string | null;
    dateRange: DateRange;
    cvId: string;
    constructor(partial: Partial<Education>);
}
