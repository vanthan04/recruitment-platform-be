import { Injectable } from '@nestjs/common';
import {
  IInterviewApplicationLookupPort,
  InterviewApplicationLookupResult,
} from '@/modules/interview/application/ports/application-lookup.port';
import { IJobApplicationRepository } from '@/modules/application/domain/repositories/job-application.repository';

@Injectable()
export class InterviewApplicationLookupAdapter implements IInterviewApplicationLookupPort {
  constructor(private readonly applicationRepository: IJobApplicationRepository) {}

  async findById(applicationId: string): Promise<InterviewApplicationLookupResult | null> {
    const application = await this.applicationRepository.findById(applicationId);
    if (!application) return null;

    return {
      id: application.id,
      userId: application.userId,
      jobId: application.jobId,
      status: application.status,
    };
  }
}
