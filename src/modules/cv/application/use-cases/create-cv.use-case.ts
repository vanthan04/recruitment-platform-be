import { Injectable } from '@nestjs/common';
import { ICvRepository } from '@/modules/cv/domain/repositories/cv.repository';
import { Cv } from '@/modules/cv/domain/entities/cv.entity';
import { CvStatus } from '@/modules/cv/domain/value-objects/cv-status.vo';
import { CvResponseMapper } from '@/modules/cv/application/mappers/cv-response.mapper';
import { CvResponseDto } from '@/modules/cv/application/dto/cv-response.dto';
import { Experience } from '@/modules/cv/domain/entities/experience.entity';
import { DateRange } from '@/modules/cv/domain/value-objects/date-range.vo';
import { Education } from '@/modules/cv/domain/entities/education.entity';
import { Skill } from '@/modules/cv/domain/entities/skill.entity';

export interface CreateCvInput {
  title: string;
  summary?: string;
  experiences?: {
    company: string;
    position: string;
    description?: string;
    startDate: Date;
    endDate?: Date;
    isCurrent?: boolean;
  }[];
  educations?: {
    school: string;
    degree: string;
    fieldOfStudy?: string;
    description?: string;
    startDate: Date;
    endDate?: Date;
  }[];
  skills?: {
    name: string;
    level?: string;
  }[];
}

@Injectable()
export class CreateCvUseCase {
  constructor(private readonly cvRepository: ICvRepository) {}

  async execute(userId: string, input: CreateCvInput): Promise<CvResponseDto> {
    const cv = new Cv({
      title: input.title,
      summary: input.summary ?? null,
      status: CvStatus.DRAFT,
      userId,
    });

    // Add experiences via aggregate methods
    if (input.experiences) {
      for (const exp of input.experiences) {
        cv.addExperience(
          new Experience({
            company: exp.company,
            position: exp.position,
            description: exp.description ?? null,
            dateRange: new DateRange(exp.startDate, exp.endDate ?? null),
            cvId: cv.id,
          }),
        );
      }
    }

    if (input.educations) {
      for (const edu of input.educations) {
        cv.addEducation(
          new Education({
            school: edu.school,
            degree: edu.degree,
            fieldOfStudy: edu.fieldOfStudy ?? null,
            description: edu.description ?? null,
            dateRange: new DateRange(edu.startDate, edu.endDate ?? null),
            cvId: cv.id,
          }),
        );
      }
    }

    if (input.skills) {
      for (const skill of input.skills) {
        cv.addSkill(
          new Skill({
            name: skill.name,
            level: skill.level ?? null,
            cvId: cv.id,
          }),
        );
      }
    }

    const saved = await this.cvRepository.save(cv);
    return CvResponseMapper.toDto(saved);
  }
}
