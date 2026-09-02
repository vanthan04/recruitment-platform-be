import { Injectable } from '@nestjs/common';
import {
  IJobSearchPort,
  JobDigestItem,
  JobSearchFilters,
} from '@/modules/job-alert/application/ports/job-search.port';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';

@Injectable()
export class JobSearchAdapter implements IJobSearchPort {
  constructor(private readonly jobRepository: IJobRepository) {}

  async findRecentMatchingJobs(
    filters: JobSearchFilters,
    since: Date,
  ): Promise<JobDigestItem[]> {
    const { jobs } = await this.jobRepository.findAllPaginated({
      page: 1,
      limit: 20,
      keyword: filters.keyword,
      location: filters.location,
      jobType: filters.jobType,
      categoryId: filters.categoryId,
    });

    return jobs
      .filter((job) => job.createdAt >= since)
      .map((job) => ({
        title: job.title,
        location: job.location,
        companyName: job.company?.name ?? null,
      }));
  }
}
