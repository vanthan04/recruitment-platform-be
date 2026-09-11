import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SkillController } from '@/modules/skill/presentation/controllers/skill.controller';
import { ISkillRepository } from '@/modules/skill/domain/repositories/skill.repository';
import { SkillPrismaRepository } from '@/modules/skill/infrastructure/skill-prisma.repository';

import { CreateSkillHandler } from '@/modules/skill/application/commands/create-skill.command';
import { UpdateSkillHandler } from '@/modules/skill/application/commands/update-skill.command';
import { DeleteSkillHandler } from '@/modules/skill/application/commands/delete-skill.command';
import { ListSkillsHandler } from '@/modules/skill/application/queries/list-skills.query';

@Module({
  imports: [CqrsModule],
  controllers: [SkillController],
  providers: [
    {
      provide: ISkillRepository,
      useClass: SkillPrismaRepository,
    },
    CreateSkillHandler,
    UpdateSkillHandler,
    DeleteSkillHandler,
    ListSkillsHandler,
  ],
  exports: [ISkillRepository],
})
export class SkillModule {}
