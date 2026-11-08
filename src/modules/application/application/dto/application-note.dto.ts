import { ApplicationNoteRecord } from '@/modules/application/domain/repositories/application-annotation.repository';

export class ApplicationNoteDto {
  id: string;
  content: string;
  /** Null once the author's account has been deleted. */
  authorId: string | null;
  createdAt: Date;

  static from(record: ApplicationNoteRecord): ApplicationNoteDto {
    const dto = new ApplicationNoteDto();
    dto.id = record.id;
    dto.content = record.content;
    dto.authorId = record.authorId;
    dto.createdAt = record.createdAt;
    return dto;
  }
}
