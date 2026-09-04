import { Injectable } from '@nestjs/common';
import {
  ISkillLookupPort,
  JobSkillSummary,
} from '@/modules/job/application/ports/skill-lookup.port';
import { ISkillRepository } from '@/modules/skill/domain/repositories/skill.repository';

@Injectable()
export class SkillLookupAdapter implements ISkillLookupPort {
  constructor(private readonly skillRepository: ISkillRepository) {}

  async findManyByIds(ids: string[]): Promise<Map<string, JobSkillSummary>> {
    const uniqueIds = [...new Set(ids)];
    const skills = await Promise.all(
      uniqueIds.map((id) => this.skillRepository.findById(id)),
    );

    const summaries = new Map<string, JobSkillSummary>();
    skills.forEach((skill, index) => {
      if (!skill) return;
      summaries.set(uniqueIds[index], {
        id: skill.id,
        name: skill.name,
        slug: skill.slug,
      });
    });
    return summaries;
  }
}
