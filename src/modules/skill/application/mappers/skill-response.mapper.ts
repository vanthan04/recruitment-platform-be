import { Skill } from '@/modules/skill/domain/entities/skill.entity';
import { SkillResponseDto } from '@/modules/skill/application/dto/skill-response.dto';

export class SkillResponseMapper {
  static toDto(skill: Skill): SkillResponseDto {
    const dto = new SkillResponseDto();
    dto.id = skill.id;
    dto.name = skill.name;
    dto.slug = skill.slug;
    dto.createdAt = skill.createdAt;
    dto.updatedAt = skill.updatedAt;
    return dto;
  }

  static toDtoList(skills: Skill[]): SkillResponseDto[] {
    return skills.map(SkillResponseMapper.toDto);
  }
}
