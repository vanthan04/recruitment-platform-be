import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ISkillRepository } from '@/modules/skill/domain/repositories/skill.repository';
import { SkillNotFoundException } from '@/modules/skill/domain/exceptions/skill.exceptions';
import { SkillResponseMapper } from '@/modules/skill/application/mappers/skill-response.mapper';
import { SkillResponseDto } from '@/modules/skill/application/dto/skill-response.dto';

export class UpdateSkillCommand {
  constructor(
    public readonly skillId: string,
    public readonly name: string,
  ) {}
}

@Injectable()
@CommandHandler(UpdateSkillCommand)
export class UpdateSkillHandler implements ICommandHandler<
  UpdateSkillCommand,
  SkillResponseDto
> {
  constructor(private readonly skillRepository: ISkillRepository) {}

  async execute({
    skillId,
    name,
  }: UpdateSkillCommand): Promise<SkillResponseDto> {
    const skill = await this.skillRepository.findById(skillId);
    if (!skill) {
      throw new SkillNotFoundException(skillId);
    }

    skill.updateName(name);

    const updated = await this.skillRepository.update(skill);
    return SkillResponseMapper.toDto(updated);
  }
}
