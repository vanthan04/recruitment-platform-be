import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionGuard } from '@/common/guards/permission.guard';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { GetMe } from '@/common/decorators/get-me.decorator';
import { Permission } from '@/common/enums/permission.enum';
import { GetMyProfileQuery } from '@/modules/user/application/queries/get-my-profile.query';
import {
  UpdateProfileCommand,
  UpdateProfileInput,
} from '@/modules/user/application/commands/update-profile.command';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
import { ApiResponse } from '@/common/dtos/api-response';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('users')
export class UserController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('me')
  @RequirePermissions(Permission.PROFILE_READ_OWN)
  @ApiOperation({ summary: 'Get own profile information' })
  async getMe(@GetMe('id') userId: string) {
    const result = await this.queryBus.execute(new GetMyProfileQuery(userId));
    return ApiResponse.ok(result, 'Profile retrieved successfully');
  }

  @Patch('profile')
  @RequirePermissions(Permission.PROFILE_UPDATE_OWN)
  @ApiOperation({ summary: 'Update own profile information' })
  async updateProfile(
    @GetMe('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    const input: UpdateProfileInput = {
      fullName: dto.fullName,
      phoneNumber: dto.phoneNumber,
      gender: dto.gender,
      // UpdateProfileInput declares `birthDate` as a `Date`, but the DTO
      // validates it as an ISO date string (`@IsDateString`) and passes it
      // straight through to Prisma, which accepts either at runtime — this
      // is a type-boundary cast, not a value conversion, so the raw string
      // still flows through unchanged.
      birthDate: dto.birthDate as unknown as Date | undefined,
      avatarUrl: dto.avatarUrl,
    };
    const result = await this.commandBus.execute(
      new UpdateProfileCommand(userId, input),
    );
    return ApiResponse.ok(null, result.message);
  }
}
