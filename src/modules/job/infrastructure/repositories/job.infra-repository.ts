import { Injectable } from '@nestjs/common';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { Job } from '@/modules/job/domain/entities/job.entity';
import { JobPrismaRepository } from '@/modules/job/infrastructure/persistence/prisma/job-prisma.repository';
import { JobMapper } from '@/modules/job/infrastructure/persistence/mappers/job.mapper';
import { ICompanyLookupPort } from '@/modules/job/application/ports/company-lookup.port';
import { ICategoryLookupPort } from '@/modules/job/application/ports/category-lookup.port';
import { Prisma } from '@prisma/client';

@Injectable()
export class JobInfraRepository implements IJobRepository {
  constructor(
    private readonly jobPrisma: JobPrismaRepository,
    private readonly companyLookupPort: ICompanyLookupPort,
    private readonly categoryLookupPort: ICategoryLookupPort,
  ) {}

  async findById(id: string): Promise<Job | null> {
    const job = JobMapper.toDomain(await this.jobPrisma.findById(id));
    if (!job) return null;
    const [enriched] = await this.attachSummaries([job]);
    return enriched;
  }

  async findAllPaginated(params: {
    page: number;
    limit: number;
    keyword?: string;
    location?: string;
    jobType?: string;
    salaryMin?: number;
    salaryMax?: number;
    companyId?: string;
    categoryId?: string;
    level?: string;
  }): Promise<{ jobs: Job[]; total: number }> {
    const skip = (params.page - 1) * params.limit;
    const where: Prisma.JobWhereInput = {
      deletedAt: null,
      status: 'OPEN', // Only show open jobs in general search
    };

    if (params.keyword) {
      // Matching on company name used to be a relational Prisma filter
      // straight into company's table — resolved via ICompanyLookupPort
      // instead, so this module never queries company's table directly.
      const matchingCompanyIds =
        await this.companyLookupPort.searchIdsByKeyword(params.keyword);
      where.OR = [
        { title: { contains: params.keyword, mode: 'insensitive' } },
        { description: { contains: params.keyword, mode: 'insensitive' } },
        ...(matchingCompanyIds.length > 0
          ? [{ companyId: { in: matchingCompanyIds } }]
          : []),
      ];
    }

    if (params.location) {
      where.location = { contains: params.location, mode: 'insensitive' };
    }

    if (params.jobType) {
      where.jobType = params.jobType as any;
    }

    if (params.salaryMin !== undefined) {
      where.salaryMax = { gte: params.salaryMin };
    }

    if (params.salaryMax !== undefined) {
      where.salaryMin = { lte: params.salaryMax };
    }

    if (params.companyId) {
      where.companyId = params.companyId;
    }

    if (params.categoryId) {
      where.categoryId = params.categoryId;
    }

    if (params.level) {
      where.level = params.level as any;
    }

    const { jobs: raws, total } = await this.jobPrisma.findAllPaginated({
      skip,
      take: params.limit,
      where,
    });

    const jobs = await this.attachSummaries(
      raws.map((r) => JobMapper.toDomain(r)!),
    );
    return { jobs, total };
  }

  async findAllByRecruiterPaginated(params: {
    recruiterId: string;
    page: number;
    limit: number;
    status?: string;
  }): Promise<{ jobs: Job[]; total: number }> {
    const skip = (params.page - 1) * params.limit;
    const where: Prisma.JobWhereInput = {
      postedById: params.recruiterId,
      deletedAt: null,
    };
    if (params.status) {
      where.status = params.status as any;
    }

    const { jobs: raws, total } = await this.jobPrisma.findAllPaginated({
      skip,
      take: params.limit,
      where,
    });

    const jobs = await this.attachSummaries(
      raws.map((r) => JobMapper.toDomain(r)!),
    );
    return { jobs, total };
  }

  async findExpiredOpenJobs(): Promise<Job[]> {
    // Internal cron use only (close-expired-jobs) — nothing here reads
    // .company/.category, so skip the lookup round-trips.
    const raws = await this.jobPrisma.findExpiredOpen();
    return raws.map((r) => JobMapper.toDomain(r)!);
  }

  async save(job: Job): Promise<Job> {
    const data = JobMapper.toPersistence(job);
    const raw = await this.jobPrisma.create(data);
    const [enriched] = await this.attachSummaries([JobMapper.toDomain(raw)!]);
    return enriched;
  }

  async update(job: Job): Promise<Job> {
    const data = JobMapper.toPersistence(job);
    const raw = await this.jobPrisma.update(job.id, data);
    const [enriched] = await this.attachSummaries([JobMapper.toDomain(raw)!]);
    return enriched;
  }

  async delete(id: string): Promise<void> {
    await this.jobPrisma.delete(id);
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.jobPrisma.incrementViewCount(id);
  }

  /** Batch-attaches company/category summaries — one lookup per unique id, not per job. */
  private async attachSummaries(jobs: Job[]): Promise<Job[]> {
    if (jobs.length === 0) return jobs;

    const companyIds = jobs.map((j) => j.companyId);
    const categoryIds = jobs
      .map((j) => j.categoryId)
      .filter((id): id is string => !!id);

    const [companies, categories] = await Promise.all([
      this.companyLookupPort.findManyByIds(companyIds),
      this.categoryLookupPort.findManyByIds(categoryIds),
    ]);

    for (const job of jobs) {
      job.company = companies.get(job.companyId);
      job.category = job.categoryId
        ? categories.get(job.categoryId)
        : undefined;
    }
    return jobs;
  }
}
