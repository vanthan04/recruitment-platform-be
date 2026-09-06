import { Injectable } from '@nestjs/common';
import {
  IChatJobLookupPort,
  ChatJobLookupResult,
} from '@/modules/chat/application/ports/job-lookup.port';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';

@Injectable()
export class ChatJobLookupAdapter implements IChatJobLookupPort {
  constructor(private readonly jobRepository: IJobRepository) {}

  async findById(jobId: string): Promise<ChatJobLookupResult | null> {
    const job = await this.jobRepository.findById(jobId);
    if (!job) return null;

    return {
      id: job.id,
      title: job.title,
      postedById: job.postedById,
      companyId: job.companyId,
    };
  }

  async findManyByIds(
    jobIds: string[],
  ): Promise<Map<string, ChatJobLookupResult>> {
    const jobs = await this.jobRepository.findByIds([...new Set(jobIds)]);
    return new Map(
      jobs.map((job) => [
        job.id,
        {
          id: job.id,
          title: job.title,
          postedById: job.postedById,
          companyId: job.companyId,
        },
      ]),
    );
  }
}
