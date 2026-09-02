import { Cv } from '@/modules/cv/domain/entities/cv.entity';
import {
  CvResponseDto,
  ExperienceResponseDto,
  EducationResponseDto,
  SkillResponseDto,
} from '@/modules/cv/application/dto/cv-response.dto';

/**
 * Maps domain entities to response DTOs.
 * Lives in the application layer — knows about both domain and DTOs.
 */
export class CvResponseMapper {
  static toDto(cv: Cv): CvResponseDto {
    const dto = new CvResponseDto();
    dto.id = cv.id;
    dto.title = cv.title;
    dto.summary = cv.summary;
    dto.fileUrl = cv.fileUrl;
    dto.status = cv.status;
    dto.publishedAt = cv.publishedAt;
    dto.createdAt = cv.createdAt;
    dto.updatedAt = cv.updatedAt;
    dto.userId = cv.userId;
    dto.experiences = (cv.experiences ?? []).map(CvResponseMapper.toExperienceDto);
    dto.educations = (cv.educations ?? []).map(CvResponseMapper.toEducationDto);
    dto.skills = (cv.skills ?? []).map(CvResponseMapper.toSkillDto);
    return dto;
  }

  static toDtoList(cvs: Cv[]): CvResponseDto[] {
    return cvs.map(CvResponseMapper.toDto);
  }

  private static toExperienceDto(exp: any): ExperienceResponseDto {
    const dto = new ExperienceResponseDto();
    dto.id = exp.id;
    dto.company = exp.company;
    dto.position = exp.position;
    dto.description = exp.description;
    dto.startDate = exp.dateRange?.startDate ?? exp.startDate;
    dto.endDate = exp.dateRange?.endDate ?? exp.endDate;
    dto.isCurrent = exp.dateRange?.isCurrent ?? exp.isCurrent ?? false;
    return dto;
  }

  private static toEducationDto(edu: any): EducationResponseDto {
    const dto = new EducationResponseDto();
    dto.id = edu.id;
    dto.school = edu.school;
    dto.degree = edu.degree;
    dto.fieldOfStudy = edu.fieldOfStudy;
    dto.description = edu.description;
    dto.startDate = edu.dateRange?.startDate ?? edu.startDate;
    dto.endDate = edu.dateRange?.endDate ?? edu.endDate;
    return dto;
  }

  private static toSkillDto(skill: any): SkillResponseDto {
    const dto = new SkillResponseDto();
    dto.id = skill.id;
    dto.name = skill.name;
    dto.level = skill.level;
    return dto;
  }
}
