import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler, Command } from '@nestjs/cqrs';
import { IJobApplicationRepository } from '@/modules/application/domain/repositories/job-application.repository';
import { IApplicationAnnotationRepository } from '@/modules/application/domain/repositories/application-annotation.repository';
import { IJobLookupPort } from '@/modules/application/application/ports/job-lookup.port';
import { ApplicationNoteNotFoundException } from '@/modules/application/domain/exceptions/application.exceptions';
import { loadApplicationOwnedBy } from '@/modules/application/application/utils/load-owned-application.util';

export class DeleteApplicationNoteCommand extends Command<void> {
  constructor(
    public readonly recruiterId: string,
    public readonly applicationId: string,
    public readonly noteId: string,
  ) {
    super();
  }
}

/** Deletes one internal note. Job owner only. */
@Injectable()
@CommandHandler(DeleteApplicationNoteCommand)
export class DeleteApplicationNoteHandler implements ICommandHandler<
  DeleteApplicationNoteCommand,
  void
> {
  constructor(
    private readonly applicationRepository: IJobApplicationRepository,
    private readonly annotationRepository: IApplicationAnnotationRepository,
    private readonly jobLookupPort: IJobLookupPort,
  ) {}

  async execute({
    recruiterId,
    applicationId,
    noteId,
  }: DeleteApplicationNoteCommand): Promise<void> {
    // Ownership is checked on the application named in the URL...
    await loadApplicationOwnedBy(
      this.applicationRepository,
      this.jobLookupPort,
      applicationId,
      recruiterId,
    );

    // ...so the note must belong to that same application. Otherwise owning
    // one application would let you delete notes on someone else's by id.
    // Reported as "not found" either way, revealing nothing about other notes.
    const note = await this.annotationRepository.findNote(noteId);
    if (!note || note.applicationId !== applicationId) {
      throw new ApplicationNoteNotFoundException(noteId);
    }

    await this.annotationRepository.deleteNote(noteId);
  }
}
