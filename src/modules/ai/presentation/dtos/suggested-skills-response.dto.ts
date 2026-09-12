import { ApiProperty } from '@nestjs/swagger';

export class SuggestedSkillDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;
}

export class SuggestedSkillsResponseDto {
  @ApiProperty({ type: [SuggestedSkillDto] })
  suggestedSkills: SuggestedSkillDto[];
}
