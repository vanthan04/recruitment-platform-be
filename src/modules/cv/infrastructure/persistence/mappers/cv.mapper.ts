import { Cv } from '@/modules/cv/domain/entities/cv.entity';
import { Experience } from '@/modules/cv/domain/entities/experience.entity';
import { Education } from '@/modules/cv/domain/entities/education.entity';
import { Skill } from '@/modules/cv/domain/entities/skill.entity';
import { CvStatus } from '@/modules/cv/domain/value-objects/cv-status.vo';
import { DateRange } from '@/modules/cv/domain/value-objects/date-range.vo';

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
      summary: raw.summary,
      status: raw.status as CvStatus,
      publishedAt: raw.publishedAt,
      deletedAt: raw.deletedAt,
      userId: raw.userId,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      experiences: raw.experiences?.map(CvMapper.experienceToDomain) ?? [],
      educations: raw.educations?.map(CvMapper.educationToDomain) ?? [],
      skills: raw.skills?.map(CvMapper.skillToDomain) ?? [],
    });
  }

  static experienceToDomain(raw: any): Experience {
    return new Experience({
      id: raw.id,
      company: raw.company,
      position: raw.position,
      description: raw.description,
      dateRange: new DateRange(raw.startDate, raw.endDate),
      cvId: raw.cvId,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static educationToDomain(raw: any): Education {
    return new Education({
      id: raw.id,
      school: raw.school,
      degree: raw.degree,
      fieldOfStudy: raw.fieldOfStudy,
      description: raw.description,
      dateRange: new DateRange(raw.startDate, raw.endDate),
      cvId: raw.cvId,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static skillToDomain(raw: any): Skill {
    return new Skill({
      id: raw.id,
      name: raw.name,
      level: raw.level,
      cvId: raw.cvId,
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
      summary: cv.summary,
      status: cv.status,
      publishedAt: cv.publishedAt,
      deletedAt: cv.deletedAt,
      userId: cv.userId,
    };
  }

  static experienceToPersistence(exp: Experience): any {
    return {
      id: exp.id,
      company: exp.company,
      position: exp.position,
      description: exp.description,
      startDate: exp.dateRange.startDate,
      endDate: exp.dateRange.endDate,
      isCurrent: exp.dateRange.isCurrent,
    };
  }

  static educationToPersistence(edu: Education): any {
    return {
      id: edu.id,
      school: edu.school,
      degree: edu.degree,
      fieldOfStudy: edu.fieldOfStudy,
      description: edu.description,
      startDate: edu.dateRange.startDate,
      endDate: edu.dateRange.endDate,
    };
  }

  static skillToPersistence(skill: Skill): any {
    return {
      id: skill.id,
      name: skill.name,
      level: skill.level,
    };
  }
}
