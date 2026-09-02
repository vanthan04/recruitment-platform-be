import { Injectable } from '@nestjs/common';
import {
  IChatApplicationLookupPort,
  ChatApplicationLookupResult,
} from '@/modules/chat/application/ports/application-lookup.port';
import { IJobApplicationRepository } from '@/modules/application/domain/repositories/job-application.repository';

@Injectable()
export class ChatApplicationLookupAdapter implements IChatApplicationLookupPort {
  constructor(
    private readonly applicationRepository: IJobApplicationRepository,
  ) {}

  async findById(
    applicationId: string,
  ): Promise<ChatApplicationLookupResult | null> {
    const application =
      await this.applicationRepository.findById(applicationId);
    if (!application) return null;

    return {
      id: application.id,
      status: application.status,
      userId: application.userId,
      jobId: application.jobId,
    };
  }
}
