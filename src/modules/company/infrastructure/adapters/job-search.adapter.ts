import { Injectable } from '@nestjs/common';
import { IJobSearchPort } from '@/modules/company/application/ports/job-search.port';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { JobResponseMapper } from '@/modules/job/application/mappers/job-response.mapper';
import { JobResponseDto } from '@/modules/job/application/dto/job-response.dto';

@Injectable()
export class JobSearchAdapter implements IJobSearchPort {
  constructor(private readonly jobRepository: IJobRepository) {}

  async findOpenJobsByCompany(companyId: string): Promise<JobResponseDto[]> {
    const { jobs } = await this.jobRepository.findAllPaginated({
      page: 1,
      limit: 50,
      companyId,
    });
    return JobResponseMapper.toDtoList(jobs);
  }
}
