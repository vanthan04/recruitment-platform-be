import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { ISkillRepository } from '@/modules/skill/domain/repositories/skill.repository';
import { SkillResponseMapper } from '@/modules/skill/application/mappers/skill-response.mapper';
import { SkillResponseDto } from '@/modules/skill/application/dto/skill-response.dto';

export class ListSkillsQuery {}

@Injectable()
@QueryHandler(ListSkillsQuery)
export class ListSkillsHandler implements IQueryHandler<
  ListSkillsQuery,
  SkillResponseDto[]
> {
  constructor(private readonly skillRepository: ISkillRepository) {}

  async execute(): Promise<SkillResponseDto[]> {
    const skills = await this.skillRepository.findAll();
    return SkillResponseMapper.toDtoList(skills);
  }
}
