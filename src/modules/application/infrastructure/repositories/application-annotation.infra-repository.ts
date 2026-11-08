import { Injectable } from '@nestjs/common';
import { ApplicationNote as PrismaApplicationNote } from '@prisma/client';
import {
  ApplicationNoteRecord,
  CreateApplicationNoteInput,
  IApplicationAnnotationRepository,
} from '@/modules/application/domain/repositories/application-annotation.repository';
import { ApplicationAnnotationPrismaRepository } from '@/modules/application/infrastructure/persistence/prisma/application-annotation-prisma.repository';

const toRecord = (raw: PrismaApplicationNote): ApplicationNoteRecord => ({
  id: raw.id,
  applicationId: raw.applicationId,
  authorId: raw.authorId,
  content: raw.content,
  createdAt: raw.createdAt,
});

@Injectable()
export class ApplicationAnnotationInfraRepository implements IApplicationAnnotationRepository {
  constructor(
    private readonly annotationPrisma: ApplicationAnnotationPrismaRepository,
  ) {}

  async findNotes(applicationId: string): Promise<ApplicationNoteRecord[]> {
    return (await this.annotationPrisma.findNotes(applicationId)).map(toRecord);
  }

  async findNote(noteId: string): Promise<ApplicationNoteRecord | null> {
    const raw = await this.annotationPrisma.findNote(noteId);
    return raw ? toRecord(raw) : null;
  }

  async createNote(
    input: CreateApplicationNoteInput,
  ): Promise<ApplicationNoteRecord> {
    return toRecord(await this.annotationPrisma.createNote(input));
  }

  async deleteNote(noteId: string): Promise<void> {
    await this.annotationPrisma.deleteNote(noteId);
  }

  async setStarred(
    applicationId: string,
    starredAt: Date | null,
  ): Promise<void> {
    await this.annotationPrisma.setStarred(applicationId, starredAt);
  }

  async findStarredApplicationIds(
    applicationIds: string[],
  ): Promise<Set<string>> {
    const rows =
      await this.annotationPrisma.findStarredApplicationIds(applicationIds);
    return new Set(rows.map((row) => row.id));
  }
}
