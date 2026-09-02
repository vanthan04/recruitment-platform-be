import { Injectable } from '@nestjs/common';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { Job } from '@/modules/job/domain/entities/job.entity';
import { JobPrismaRepository } from '@/modules/job/infrastructure/persistence/prisma/job-prisma.repository';
import { JobMapper } from '@/modules/job/infrastructure/persistence/mappers/job.mapper';
import { Prisma } from '@prisma/client';

@Injectable()
export class JobInfraRepository implements IJobRepository {
  constructor(private readonly jobPrisma: JobPrismaRepository) {}

  async findById(id: string): Promise<Job | null> {
    const raw = await this.jobPrisma.findById(id);
    return JobMapper.toDomain(raw);
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
      where.OR = [
        { title: { contains: params.keyword, mode: 'insensitive' } },
        { description: { contains: params.keyword, mode: 'insensitive' } },
        { company: { name: { contains: params.keyword, mode: 'insensitive' } } },
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

    return {
      jobs: raws.map((r) => JobMapper.toDomain(r)!),
      total,
    };
  }

  async findAllByRecruiter(recruiterId: string): Promise<Job[]> {
    const raws = await this.jobPrisma.findAllByRecruiter(recruiterId);
    return raws.map((r) => JobMapper.toDomain(r)!);
  }

  async findExpiredOpenJobs(): Promise<Job[]> {
    const raws = await this.jobPrisma.findExpiredOpen();
    return raws.map((r) => JobMapper.toDomain(r)!);
  }

  async save(job: Job): Promise<Job> {
    const data = JobMapper.toPersistence(job);
    const raw = await this.jobPrisma.create(data);
    return JobMapper.toDomain(raw)!;
  }

  async update(job: Job): Promise<Job> {
    const data = JobMapper.toPersistence(job);
    const raw = await this.jobPrisma.update(job.id, data);
    return JobMapper.toDomain(raw)!;
  }

  async delete(id: string): Promise<void> {
    await this.jobPrisma.delete(id);
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.jobPrisma.incrementViewCount(id);
  }
}
