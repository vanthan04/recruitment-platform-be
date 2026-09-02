import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { GetMe } from '@/common/decorators/get-me.decorator';
import { ApiResponse } from '@/common/dtos/api-response';

import { MarkAsReadCommand } from '@/modules/notification/application/commands/mark-as-read.command';
import { MarkAllAsReadCommand } from '@/modules/notification/application/commands/mark-all-as-read.command';
import { ListMyNotificationsQuery } from '@/modules/notification/application/queries/list-my-notifications.query';
import { ListNotificationsDto } from '@/modules/notification/presentation/dtos/list-notifications.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List my notifications' })
  async list(@GetMe('id') userId: string, @Query() query: ListNotificationsDto) {
    const result = await this.queryBus.execute(
      new ListMyNotificationsQuery(userId, query.page ?? 1, query.limit ?? 10),
    );
    return ApiResponse.ok(result.notifications, 'Notifications retrieved successfully', {
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark one notification as read' })
  async markAsRead(@GetMe('id') userId: string, @Param('id') notificationId: string) {
    const result = await this.commandBus.execute(new MarkAsReadCommand(userId, notificationId));
    return ApiResponse.ok(result, 'Notification marked as read');
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all my notifications as read' })
  async markAllAsRead(@GetMe('id') userId: string) {
    await this.commandBus.execute(new MarkAllAsReadCommand(userId));
    return ApiResponse.ok(null, 'All notifications marked as read');
  }
}
