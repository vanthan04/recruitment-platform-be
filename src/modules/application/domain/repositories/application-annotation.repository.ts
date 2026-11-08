/**
 * Recruiter-private review data on an application: a star, and internal notes.
 *
 * Kept apart from IJobApplicationRepository on purpose. The JobApplication
 * entity and ApplicationResponseDto are also what the *candidate* sees; keeping
 * this data out of them means no candidate-facing path can return it by
 * accident. It also lets the star be written as its own column, so toggling it
 * can never overwrite a status change made at the same time from a stale copy.
 */

/** The longest note accepted (mirrored by AddApplicationNoteDto). */
export const APPLICATION_NOTE_MAX_LENGTH = 2000;

export interface ApplicationNoteRecord {
  id: string;
  applicationId: string;
  /** Null once the author's account has been deleted — attribution only. */
  authorId: string | null;
  content: string;
  createdAt: Date;
}

export interface CreateApplicationNoteInput {
  applicationId: string;
  authorId: string;
  content: string;
}

export abstract class IApplicationAnnotationRepository {
  /** Newest first. */
  abstract findNotes(applicationId: string): Promise<ApplicationNoteRecord[]>;
  abstract findNote(noteId: string): Promise<ApplicationNoteRecord | null>;
  abstract createNote(
    input: CreateApplicationNoteInput,
  ): Promise<ApplicationNoteRecord>;
  abstract deleteNote(noteId: string): Promise<void>;

  /** `null` unstars. Touches only the star — never the application's status. */
  abstract setStarred(
    applicationId: string,
    starredAt: Date | null,
  ): Promise<void>;
  /** Which of these applications are starred, in one query. */
  abstract findStarredApplicationIds(
    applicationIds: string[],
  ): Promise<Set<string>>;
}
