import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionGuard } from '@/common/guards/permission.guard';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { Permission } from '@/common/enums/permission.enum';
import { ApiResponse } from '@/common/dtos/api-response';

import { CreateSkillCommand } from '@/modules/skill/application/commands/create-skill.command';
import { UpdateSkillCommand } from '@/modules/skill/application/commands/update-skill.command';
import { DeleteSkillCommand } from '@/modules/skill/application/commands/delete-skill.command';
import { ListSkillsQuery } from '@/modules/skill/application/queries/list-skills.query';

import { CreateSkillDto } from '@/modules/skill/presentation/dtos/create-skill.dto';
import { UpdateSkillDto } from '@/modules/skill/presentation/dtos/update-skill.dto';

@ApiTags('skills')
@Controller('skills')
export class SkillController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions(Permission.SKILL_CREATE)
  @ApiOperation({ summary: 'Create a skill (Admin only)' })
  async create(@Body() dto: CreateSkillDto) {
    const result = await this.commandBus.execute(
      new CreateSkillCommand(dto.name),
    );
    return ApiResponse.ok(result, 'Skill created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'List all skills (public)' })
  async list() {
    const result = await this.queryBus.execute(new ListSkillsQuery());
    return ApiResponse.ok(result, 'Skills retrieved successfully');
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions(Permission.SKILL_UPDATE)
  @ApiOperation({ summary: 'Update a skill (Admin only)' })
  async update(@Param('id') skillId: string, @Body() dto: UpdateSkillDto) {
    const result = await this.commandBus.execute(
      new UpdateSkillCommand(skillId, dto.name!),
    );
    return ApiResponse.ok(result, 'Skill updated successfully');
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions(Permission.SKILL_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a skill (Admin only)' })
  async delete(@Param('id') skillId: string) {
    await this.commandBus.execute(new DeleteSkillCommand(skillId));
  }
}
