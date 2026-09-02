import { JobResponseDto } from '@/modules/job/application/dto/job-response.dto';

export abstract class IJobSearchPort {
  abstract findOpenJobsByCompany(companyId: string): Promise<JobResponseDto[]>;
}
