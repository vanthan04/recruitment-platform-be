import { Injectable } from '@nestjs/common';
import {
  IInterviewJobLookupPort,
  InterviewJobLookupResult,
} from '@/modules/interview/application/ports/job-lookup.port';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';

@Injectable()
export class InterviewJobLookupAdapter implements IInterviewJobLookupPort {
  constructor(private readonly jobRepository: IJobRepository) {}

  async findById(jobId: string): Promise<InterviewJobLookupResult | null> {
    const job = await this.jobRepository.findById(jobId);
    if (!job) return null;

    return {
      id: job.id,
      title: job.title,
      postedById: job.postedById,
    };
  }
}
