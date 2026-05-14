import { Injectable } from '@nestjs/common';
import { ICvRepository } from '@/modules/cv/domain/repositories/cv.repository';
import { EntityNotFoundException } from '@/common/exceptions/domain.exception';
import { CvResponseMapper } from '@/modules/cv/application/mappers/cv-response.mapper';
import { CvResponseDto } from '@/modules/cv/application/dto/cv-response.dto';
import { Experience } from '@/modules/cv/domain/entities/experience.entity';
import { Education } from '@/modules/cv/domain/entities/education.entity';
import { Skill } from '@/modules/cv/domain/entities/skill.entity';
import { DateRange } from '@/modules/cv/domain/value-objects/date-range.vo';

export interface UpdateCvInput {
  title?: string;
  summary?: string;
  experiences?: {
    id?: string;
    company: string;
    position: string;
    description?: string;
    startDate: Date;
    endDate?: Date;
    isCurrent?: boolean;
  }[];
  educations?: {
    id?: string;
    school: string;
    degree: string;
    fieldOfStudy?: string;
    description?: string;
    startDate: Date;
    endDate?: Date;
  }[];
  skills?: {
    id?: string;
    name: string;
    level?: string;
  }[];
}

@Injectable()
export class UpdateCvUseCase {
  constructor(private readonly cvRepository: ICvRepository) {}

  async execute(
    userId: string,
    cvId: string,
    input: UpdateCvInput,
  ): Promise<CvResponseDto> {
    const cv = await this.cvRepository.findByIdWithRelations(cvId);
    if (!cv) {
      throw new EntityNotFoundException('CV', cvId);
    }

    // Domain guard: ensure ownership
    cv.ensureOwner(userId);

    // Update basic fields via domain methods
    if (input.title !== undefined) {
      cv.updateTitle(input.title);
    }
    if (input.summary !== undefined) {
      cv.updateSummary(input.summary);
    }

    // Replace collections if provided (full replace strategy)
    if (input.experiences !== undefined) {
      cv.experiences = input.experiences.map(
        (exp) =>
          new Experience({
            id: exp.id,
            company: exp.company,
            position: exp.position,
            description: exp.description ?? null,
            dateRange: new DateRange(exp.startDate, exp.endDate ?? null),
            cvId: cv.id,
          }),
      );
    }

    if (input.educations !== undefined) {
      cv.educations = input.educations.map(
        (edu) =>
          new Education({
            id: edu.id,
            school: edu.school,
            degree: edu.degree,
            fieldOfStudy: edu.fieldOfStudy ?? null,
            description: edu.description ?? null,
            dateRange: new DateRange(edu.startDate, edu.endDate ?? null),
            cvId: cv.id,
          }),
      );
    }

    if (input.skills !== undefined) {
      cv.skills = input.skills.map(
        (s) =>
          new Skill({
            id: s.id,
            name: s.name,
            level: s.level ?? null,
            cvId: cv.id,
          }),
      );
    }

    const updated = await this.cvRepository.update(cv);
    return CvResponseMapper.toDto(updated);
  }
}
