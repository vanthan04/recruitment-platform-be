import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler, Command } from '@nestjs/cqrs';
import { IJobApplicationRepository } from '@/modules/application/domain/repositories/job-application.repository';
import {
  APPLICATION_NOTE_MAX_LENGTH,
  IApplicationAnnotationRepository,
} from '@/modules/application/domain/repositories/application-annotation.repository';
import { IJobLookupPort } from '@/modules/application/application/ports/job-lookup.port';
import { ApplicationNoteDto } from '@/modules/application/application/dto/application-note.dto';
import { ApplicationNoteInvalidException } from '@/modules/application/domain/exceptions/application.exceptions';
import { loadApplicationOwnedBy } from '@/modules/application/application/utils/load-owned-application.util';

export class AddApplicationNoteCommand extends Command<ApplicationNoteDto> {
  constructor(
    public readonly recruiterId: string,
    public readonly applicationId: string,
    public readonly content: string,
  ) {
    super();
  }
}

/**
 * Adds an internal note to an application. Job owner only; allowed at any
 * status (a note after a rejection is still useful), never shown to the
 * candidate.
 */
@Injectable()
@CommandHandler(AddApplicationNoteCommand)
export class AddApplicationNoteHandler implements ICommandHandler<
  AddApplicationNoteCommand,
  ApplicationNoteDto
> {
  constructor(
    private readonly applicationRepository: IJobApplicationRepository,
    private readonly annotationRepository: IApplicationAnnotationRepository,
    private readonly jobLookupPort: IJobLookupPort,
  ) {}

  async execute({
    recruiterId,
    applicationId,
    content,
  }: AddApplicationNoteCommand): Promise<ApplicationNoteDto> {
    await loadApplicationOwnedBy(
      this.applicationRepository,
      this.jobLookupPort,
      applicationId,
      recruiterId,
    );

    // The DTO already rejects an empty string; this also catches whitespace
    // only, and is the rule for any caller that isn't the HTTP layer.
    const trimmed = content.trim();
    if (!trimmed) {
      throw new ApplicationNoteInvalidException('A note cannot be empty');
    }
    if (trimmed.length > APPLICATION_NOTE_MAX_LENGTH) {
      throw new ApplicationNoteInvalidException(
        `A note cannot be longer than ${APPLICATION_NOTE_MAX_LENGTH} characters`,
      );
    }

    const note = await this.annotationRepository.createNote({
      applicationId,
      authorId: recruiterId,
      content: trimmed,
    });
    return ApplicationNoteDto.from(note);
  }
}
