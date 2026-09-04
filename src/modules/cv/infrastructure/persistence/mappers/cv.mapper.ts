import { Cv } from '@/modules/cv/domain/entities/cv.entity';
import { CvStatus } from '@/modules/cv/domain/value-objects/cv-status.vo';
import { CvFileType } from '@/modules/cv/domain/value-objects/cv-file-type.vo';

/**
 * Maps Prisma raw data to domain entities and vice versa.
 * Lives in the infrastructure layer — knows about both Prisma shape and domain.
 */
export class CvMapper {
  static toDomain(raw: any): Cv | null {
    if (!raw) return null;

    return new Cv({
      id: raw.id,
      title: raw.title,
      originalName: raw.originalName,
      fileType: raw.fileType as CvFileType,
      mimeType: raw.mimeType,
      fileSize: raw.fileSize,
      fileKey: raw.fileKey,
      status: raw.status as CvStatus,
      deletedAt: raw.deletedAt,
      userId: raw.userId,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  /**
   * Map domain entity to Prisma create/update data shape.
   */
  static toPersistence(cv: Cv): any {
    return {
      id: cv.id,
      title: cv.title,
      originalName: cv.originalName,
      fileType: cv.fileType,
      mimeType: cv.mimeType,
      fileSize: cv.fileSize,
      fileKey: cv.fileKey,
      status: cv.status,
      deletedAt: cv.deletedAt,
      userId: cv.userId,
    };
  }
}
