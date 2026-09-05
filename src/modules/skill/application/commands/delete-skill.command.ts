import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ISkillRepository } from '@/modules/skill/domain/repositories/skill.repository';
import {
  SkillNotFoundException,
  SkillInUseException,
} from '@/modules/skill/domain/exceptions/skill.exceptions';

export class DeleteSkillCommand {
  constructor(public readonly skillId: string) {}
}

@Injectable()
@CommandHandler(DeleteSkillCommand)
export class DeleteSkillHandler implements ICommandHandler<
  DeleteSkillCommand,
  void
> {
  constructor(private readonly skillRepository: ISkillRepository) {}

  async execute({ skillId }: DeleteSkillCommand): Promise<void> {
    const skill = await this.skillRepository.findById(skillId);
    if (!skill) {
      throw new SkillNotFoundException(skillId);
    }

    // JobSkill cascades on delete (hard FK), so deleting a shared, admin-
    // managed skill would silently un-tag every job using it with no
    // confirmation and no audit trail — block it instead.
    const jobCount = await this.skillRepository.countReferencingJobs(skillId);
    if (jobCount > 0) {
      throw new SkillInUseException(jobCount);
    }

    await this.skillRepository.delete(skillId);
  }
}
