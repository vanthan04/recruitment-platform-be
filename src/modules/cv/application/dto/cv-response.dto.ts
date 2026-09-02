/**
 * CV Response DTO — Application layer output.
 * Decoupled from domain entity. Used by controllers as response format.
 */
export class CvResponseDto {
  id: string;
  title: string;
  summary: string | null;
  fileUrl: string | null;
  status: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  experiences: ExperienceResponseDto[];
  educations: EducationResponseDto[];
  skills: SkillResponseDto[];
}

export class ExperienceResponseDto {
  id: string;
  company: string;
  position: string;
  description: string | null;
  startDate: Date;
  endDate: Date | null;
  isCurrent: boolean;
}

export class EducationResponseDto {
  id: string;
  school: string;
  degree: string;
  fieldOfStudy: string | null;
  description: string | null;
  startDate: Date;
  endDate: Date | null;
}

export class SkillResponseDto {
  id: string;
  name: string;
  level: string | null;
}
