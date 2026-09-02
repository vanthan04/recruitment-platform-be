import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ICvRepository } from '@/modules/cv/domain/repositories/cv.repository';
import { CvNotFoundException } from '@/modules/cv/domain/exceptions/cv.exceptions';
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

export class UpdateCvCommand {
  constructor(
    public readonly userId: string,
    public readonly cvId: string,
    public readonly input: UpdateCvInput,
  ) {}
}

@Injectable()
@CommandHandler(UpdateCvCommand)
export class UpdateCvHandler implements ICommandHandler<
  UpdateCvCommand,
  CvResponseDto
> {
  constructor(private readonly cvRepository: ICvRepository) {}

  async execute({
    userId,
    cvId,
    input,
  }: UpdateCvCommand): Promise<CvResponseDto> {
    const cv = await this.cvRepository.findByIdWithRelations(cvId);
    if (!cv) {
      throw new CvNotFoundException(cvId);
    }

    cv.ensureOwner(userId);

    if (input.title !== undefined) {
      cv.updateTitle(input.title);
    }
    if (input.summary !== undefined) {
      cv.updateSummary(input.summary);
    }

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
