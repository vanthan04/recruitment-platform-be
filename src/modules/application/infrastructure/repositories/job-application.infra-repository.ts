import { Injectable } from '@nestjs/common';
import { IJobApplicationRepository } from '@/modules/application/domain/repositories/job-application.repository';
import { JobApplication } from '@/modules/application/domain/entities/job-application.entity';
import { JobApplicationPrismaRepository } from '@/modules/application/infrastructure/persistence/prisma/job-application-prisma.repository';
import { JobApplicationMapper } from '@/modules/application/infrastructure/persistence/mappers/job-application.mapper';

@Injectable()
export class JobApplicationInfraRepository implements IJobApplicationRepository {
  constructor(
    private readonly applicationPrisma: JobApplicationPrismaRepository,
  ) {}

  async findById(id: string): Promise<JobApplication | null> {
    const raw = await this.applicationPrisma.findById(id);
    return JobApplicationMapper.toDomain(raw);
  }

  async findByUserIdAndJobId(
    userId: string,
    jobId: string,
  ): Promise<JobApplication | null> {
    const raw = await this.applicationPrisma.findByUserIdAndJobId(
      userId,
      jobId,
    );
    return JobApplicationMapper.toDomain(raw);
  }

  async findAllByJobId(
    jobId: string,
    params: { skip: number; take: number },
  ): Promise<{ applications: JobApplication[]; total: number }> {
    const { applications: raws, total } =
      await this.applicationPrisma.findAllByJobId(jobId, params);
    return {
      applications: raws.map((r) => JobApplicationMapper.toDomain(r)!),
      total,
    };
  }

  async findAllByUserId(userId: string): Promise<JobApplication[]> {
    const raws = await this.applicationPrisma.findAllByUserId(userId);
    return raws.map((r) => JobApplicationMapper.toDomain(r)!);
  }

  async save(application: JobApplication): Promise<JobApplication> {
    const data = JobApplicationMapper.toPersistence(application);
    const raw = await this.applicationPrisma.create(data);
    return JobApplicationMapper.toDomain(raw)!;
  }

  async update(application: JobApplication): Promise<JobApplication> {
    const data = JobApplicationMapper.toPersistence(application);
    const raw = await this.applicationPrisma.update(application.id, data);
    return JobApplicationMapper.toDomain(raw)!;
  }

  async countByJobIdGroupedByStatus(
    jobId: string,
  ): Promise<Record<string, number>> {
    const groups =
      await this.applicationPrisma.countByJobIdGroupedByStatus(jobId);
    return groups.reduce<Record<string, number>>((acc, g) => {
      acc[g.status] = g._count._all;
      return acc;
    }, {});
  }
}
