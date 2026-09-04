import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ISkillRepository } from '@/modules/skill/domain/repositories/skill.repository';
import { SkillNotFoundException } from '@/modules/skill/domain/exceptions/skill.exceptions';

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

    await this.skillRepository.delete(skillId);
  }
}
