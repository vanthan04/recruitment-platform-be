import { Injectable } from '@nestjs/common';
import { IJobLookupPort, JobLookupResult } from '@/modules/application/application/ports/job-lookup.port';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';

@Injectable()
export class JobLookupAdapter implements IJobLookupPort {
  constructor(private readonly jobRepository: IJobRepository) {}

  async findById(jobId: string): Promise<JobLookupResult | null> {
    const job = await this.jobRepository.findById(jobId);
    if (!job) return null;

    return {
      id: job.id,
      title: job.title,
      postedById: job.postedById,
      isOpen: job.isOpen,
      isExpired: job.isExpired,
      isDeleted: job.isDeleted,
      viewCount: job.viewCount,
    };
  }
}
