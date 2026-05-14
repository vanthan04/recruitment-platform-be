import { JobType } from '@/modules/job/domain/value-objects/job-type.vo';
import { PageOptionsDto } from '@/common/dtos/page-options.dto';
export declare class SearchJobDto extends PageOptionsDto {
    keyword?: string;
    location?: string;
    jobType?: JobType;
    salaryMin?: number;
    salaryMax?: number;
}
