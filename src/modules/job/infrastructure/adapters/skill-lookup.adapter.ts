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
    const skills = await this.skillRepository.findManyByIds(uniqueIds);

    const summaries = new Map<string, JobSkillSummary>();
    for (const skill of skills) {
      summaries.set(skill.id, {
        id: skill.id,
        name: skill.name,
        slug: skill.slug,
      });
    }
    return summaries;
  }
}
