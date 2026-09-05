import { Injectable } from '@nestjs/common';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { Job } from '@/modules/job/domain/entities/job.entity';
import { JobPrismaRepository } from '@/modules/job/infrastructure/persistence/prisma/job-prisma.repository';
import { JobMapper } from '@/modules/job/infrastructure/persistence/mappers/job.mapper';
import { ICompanyLookupPort } from '@/modules/job/application/ports/company-lookup.port';
import { ICategoryLookupPort } from '@/modules/job/application/ports/category-lookup.port';
import {
  ISkillLookupPort,
  JobSkillSummary,
} from '@/modules/job/application/ports/skill-lookup.port';
import { normalizePagination } from '@/common/utils/pagination.util';
import { JobSortOption } from '@/modules/job/domain/value-objects/job-sort-option.vo';
import { Prisma } from '@prisma/client';

function buildOrderBy(
  sort?: JobSortOption,
): Prisma.JobOrderByWithRelationInput {
  switch (sort) {
    case JobSortOption.SALARY_DESC:
      // Jobs with no salary set sort last, not first — a NULL isn't the
      // highest salary, treating it as such would push undisclosed-salary
      // jobs to the top of a "highest pay first" sort.
      return { salaryMax: { sort: 'desc', nulls: 'last' } };
    case JobSortOption.VIEWS_DESC:
      return { viewCount: 'desc' };
    case JobSortOption.NEWEST:
    default:
      return { createdAt: 'desc' };
  }
}

@Injectable()
export class JobInfraRepository implements IJobRepository {
  constructor(
    private readonly jobPrisma: JobPrismaRepository,
    private readonly companyLookupPort: ICompanyLookupPort,
    private readonly categoryLookupPort: ICategoryLookupPort,
    private readonly skillLookupPort: ISkillLookupPort,
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
    employmentType?: string;
    workMode?: string;
    salaryMin?: number;
    salaryMax?: number;
    companyId?: string;
    categoryId?: string;
    level?: string;
    sort?: JobSortOption;
    skillIds?: string[];
  }): Promise<{ jobs: Job[]; total: number }> {
    const { skip, limit } = normalizePagination(params);
    const where: Prisma.JobWhereInput = {
      deletedAt: null,
      status: 'OPEN', // Only show open jobs in general search
      // A job past its expiresAt is only actually closed by the hourly
      // close-expired-jobs cron — without this, an expired-but-still-OPEN
      // job stays visible in search for up to an hour and candidates hit
      // JobPostingExpiredException when they try to apply to it. Kept under
      // `AND` (not `where.OR`) because the keyword branch below reassigns
      // `where.OR` for its own purposes.
      AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }],
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

    if (params.employmentType) {
      where.employmentType = params.employmentType as any;
    }

    if (params.workMode) {
      where.workMode = params.workMode as any;
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

    if (params.skillIds?.length) {
      // Job matches if it has at least one of the requested skills — stays
      // entirely inside this module's own Prisma access (Job -> JobSkill),
      // no cross-module port needed.
      where.skills = { some: { skillId: { in: params.skillIds } } };
    }

    if (params.level) {
      where.level = params.level as any;
    }

    const { jobs: raws, total } = await this.jobPrisma.findAllPaginated({
      skip,
      take: limit,
      where,
      orderBy: buildOrderBy(params.sort),
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
    const { skip, limit } = normalizePagination(params);
    const where: Prisma.JobWhereInput = {
      postedById: params.recruiterId,
      deletedAt: null,
    };
    if (params.status) {
      where.status = params.status as any;
    }

    const { jobs: raws, total } = await this.jobPrisma.findAllPaginated({
      skip,
      take: limit,
      where,
    });

    const jobs = await this.attachSummaries(
      raws.map((r) => JobMapper.toDomain(r)!),
    );
    return { jobs, total };
  }

  async findExpiredOpenJobs(): Promise<Job[]> {
    // Internal cron use only (close-expired-jobs) — nothing here reads
    // .company/.category/.skills, so skip the lookup round-trips.
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

  async setSkills(jobId: string, skillIds: string[]): Promise<void> {
    await this.jobPrisma.setSkills(jobId, skillIds);
  }

  /** Batch-attaches company/category/skill summaries — one lookup per unique id, not per job. */
  private async attachSummaries(jobs: Job[]): Promise<Job[]> {
    if (jobs.length === 0) return jobs;

    const companyIds = jobs.map((j) => j.companyId);
    const categoryIds = jobs
      .map((j) => j.categoryId)
      .filter((id): id is string => !!id);
    const jobIds = jobs.map((j) => j.id);

    const [companies, categories, jobSkillLinks] = await Promise.all([
      this.companyLookupPort.findManyByIds(companyIds),
      this.categoryLookupPort.findManyByIds(categoryIds),
      this.jobPrisma.findSkillIdsByJobIds(jobIds),
    ]);

    const skillIdsByJobId = new Map<string, string[]>();
    for (const link of jobSkillLinks) {
      const list = skillIdsByJobId.get(link.jobId) ?? [];
      list.push(link.skillId);
      skillIdsByJobId.set(link.jobId, list);
    }
    const skillSummaries = await this.skillLookupPort.findManyByIds(
      jobSkillLinks.map((l) => l.skillId),
    );

    for (const job of jobs) {
      job.company = companies.get(job.companyId);
      job.category = job.categoryId
        ? categories.get(job.categoryId)
        : undefined;
      job.skills = (skillIdsByJobId.get(job.id) ?? [])
        .map((id) => skillSummaries.get(id))
        .filter((s): s is JobSkillSummary => !!s);
    }
    return jobs;
  }
}
