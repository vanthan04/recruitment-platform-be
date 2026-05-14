import { JobApplication } from '@/modules/application/domain/entities/job-application.entity';
import { ApplicationStatus } from '@/modules/application/domain/value-objects/application-status.vo';

export class JobApplicationMapper {
  static toDomain(raw: any): JobApplication | null {
    if (!raw) return null;

    return new JobApplication({
      id: raw.id,
      status: raw.status as ApplicationStatus,
      coverLetter: raw.coverLetter,
      userId: raw.userId,
      jobId: raw.jobId,
      cvId: raw.cvId,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPersistence(app: JobApplication): any {
    return {
      status: app.status,
      coverLetter: app.coverLetter,
      userId: app.userId,
      jobId: app.jobId,
      cvId: app.cvId,
    };
  }
}
