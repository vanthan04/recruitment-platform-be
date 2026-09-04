import { EntityNotFoundException } from '@/common/exceptions/domain.exception';

export class SkillNotFoundException extends EntityNotFoundException {
  constructor(id?: string) {
    super('Skill', id, 'SKILL_NOT_FOUND');
    this.name = 'SkillNotFoundException';
  }
}
