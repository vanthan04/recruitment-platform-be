import { Injectable } from '@nestjs/common';
import { IJobLookupPort } from '@/modules/bookmark/application/ports/job-lookup.port';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';

@Injectable()
export class JobLookupAdapter implements IJobLookupPort {
  constructor(private readonly jobRepository: IJobRepository) {}

  async exists(jobId: string): Promise<boolean> {
    const job = await this.jobRepository.findById(jobId);
    return !!job;
  }
}
