import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ISkillRepository } from '@/modules/skill/domain/repositories/skill.repository';
import { Skill } from '@/modules/skill/domain/entities/skill.entity';
import { SkillResponseMapper } from '@/modules/skill/application/mappers/skill-response.mapper';
import { SkillResponseDto } from '@/modules/skill/application/dto/skill-response.dto';

export class CreateSkillCommand {
  constructor(public readonly name: string) {}
}

@Injectable()
@CommandHandler(CreateSkillCommand)
export class CreateSkillHandler implements ICommandHandler<
  CreateSkillCommand,
  SkillResponseDto
> {
  constructor(private readonly skillRepository: ISkillRepository) {}

  async execute({ name }: CreateSkillCommand): Promise<SkillResponseDto> {
    const slug = await this.generateUniqueSlug(name);

    const skill = new Skill({ name, slug });
    const saved = await this.skillRepository.save(skill);

    return SkillResponseMapper.toDto(saved);
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let slug = base;
    let suffix = 1;
    while (await this.skillRepository.existsBySlug(slug)) {
      slug = `${base}-${++suffix}`;
    }
    return slug;
  }
}
