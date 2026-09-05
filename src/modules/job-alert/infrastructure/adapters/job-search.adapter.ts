import { Injectable } from '@nestjs/common';
import {
  IJobSearchPort,
  JobDigestResult,
  JobSearchFilters,
} from '@/modules/job-alert/application/ports/job-search.port';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';

// How many individual jobs the digest email body lists — `total` (from the
// query itself, not filtered client-side afterward) covers however many
// actually matched, so a saved search with more than this many new jobs in
// a day still reports the real count instead of silently capping at it.
const DIGEST_DISPLAY_LIMIT = 50;

@Injectable()
export class JobSearchAdapter implements IJobSearchPort {
  constructor(private readonly jobRepository: IJobRepository) {}

  async findRecentMatchingJobs(
    filters: JobSearchFilters,
    since: Date,
  ): Promise<JobDigestResult> {
    const { jobs, total } = await this.jobRepository.findAllPaginated({
      page: 1,
      limit: DIGEST_DISPLAY_LIMIT,
      keyword: filters.keyword,
      location: filters.location,
      employmentType: filters.employmentType,
      workMode: filters.workMode,
      categoryId: filters.categoryId,
      createdAfter: since,
    });

    return {
      items: jobs.map((job) => ({
        title: job.title,
        location: job.location,
        companyName: job.company?.name ?? null,
      })),
      total,
    };
  }
}
