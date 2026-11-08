import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler, Query } from '@nestjs/cqrs';
import { IJobApplicationRepository } from '@/modules/application/domain/repositories/job-application.repository';
import { IApplicationAnnotationRepository } from '@/modules/application/domain/repositories/application-annotation.repository';
import { IJobLookupPort } from '@/modules/application/application/ports/job-lookup.port';
import { ApplicationNoteDto } from '@/modules/application/application/dto/application-note.dto';
import { loadApplicationOwnedBy } from '@/modules/application/application/utils/load-owned-application.util';

export class ListApplicationNotesQuery extends Query<ApplicationNoteDto[]> {
  constructor(
    public readonly recruiterId: string,
    public readonly applicationId: string,
  ) {
    super();
  }
}

/** The recruiter's internal notes on an application, newest first. Job owner only. */
@Injectable()
@QueryHandler(ListApplicationNotesQuery)
export class ListApplicationNotesHandler implements IQueryHandler<
  ListApplicationNotesQuery,
  ApplicationNoteDto[]
> {
  constructor(
    private readonly applicationRepository: IJobApplicationRepository,
    private readonly annotationRepository: IApplicationAnnotationRepository,
    private readonly jobLookupPort: IJobLookupPort,
  ) {}

  async execute({
    recruiterId,
    applicationId,
  }: ListApplicationNotesQuery): Promise<ApplicationNoteDto[]> {
    await loadApplicationOwnedBy(
      this.applicationRepository,
      this.jobLookupPort,
      applicationId,
      recruiterId,
    );
    const notes = await this.annotationRepository.findNotes(applicationId);
    return notes.map((note) => ApplicationNoteDto.from(note));
  }
}
