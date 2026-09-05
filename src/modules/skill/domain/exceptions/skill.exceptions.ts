import {
  EntityNotFoundException,
  BusinessRuleViolationException,
} from '@/common/exceptions/domain.exception';

export class SkillNotFoundException extends EntityNotFoundException {
  constructor(id?: string) {
    super('Skill', id, 'SKILL_NOT_FOUND');
    this.name = 'SkillNotFoundException';
  }
}

export class SkillInUseException extends BusinessRuleViolationException {
  constructor(jobCount: number) {
    super(
      `Cannot delete this skill — it is still used by ${jobCount} job(s)`,
      'SKILL_IN_USE',
    );
    this.name = 'SkillInUseException';
  }
}
