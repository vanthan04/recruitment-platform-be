import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler, Command } from '@nestjs/cqrs';
import { IJobApplicationRepository } from '@/modules/application/domain/repositories/job-application.repository';
import { IApplicationAnnotationRepository } from '@/modules/application/domain/repositories/application-annotation.repository';
import { IJobLookupPort } from '@/modules/application/application/ports/job-lookup.port';
import { loadApplicationOwnedBy } from '@/modules/application/application/utils/load-owned-application.util';

export interface SetApplicationStarredResult {
  isStarred: boolean;
}

export class SetApplicationStarredCommand extends Command<SetApplicationStarredResult> {
  constructor(
    public readonly recruiterId: string,
    public readonly applicationId: string,
    public readonly starred: boolean,
  ) {
    super();
  }
}

/**
 * Stars or unstars an application. Job owner only; idempotent (setting the
 * state it already has is fine), allowed at any status.
 */
@Injectable()
@CommandHandler(SetApplicationStarredCommand)
export class SetApplicationStarredHandler implements ICommandHandler<
  SetApplicationStarredCommand,
  SetApplicationStarredResult
> {
  constructor(
    private readonly applicationRepository: IJobApplicationRepository,
    private readonly annotationRepository: IApplicationAnnotationRepository,
    private readonly jobLookupPort: IJobLookupPort,
  ) {}

  async execute({
    recruiterId,
    applicationId,
    starred,
  }: SetApplicationStarredCommand): Promise<SetApplicationStarredResult> {
    await loadApplicationOwnedBy(
      this.applicationRepository,
      this.jobLookupPort,
      applicationId,
      recruiterId,
    );
    await this.annotationRepository.setStarred(
      applicationId,
      starred ? new Date() : null,
    );
    return { isStarred: starred };
  }
}
