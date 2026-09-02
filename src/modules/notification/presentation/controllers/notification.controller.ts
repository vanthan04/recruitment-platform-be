import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/presentation/security/guards/jwt-auth.guard';
import { GetMe } from '@/common/decorators/get-me.decorator';
import { ApiResponse } from '@/common/dtos/api-response';

import { ListMyNotificationsUseCase } from '@/modules/notification/application/use-cases/list-my-notifications.use-case';
import { MarkAsReadUseCase } from '@/modules/notification/application/use-cases/mark-as-read.use-case';
import { MarkAllAsReadUseCase } from '@/modules/notification/application/use-cases/mark-all-as-read.use-case';
import { ListNotificationsDto } from '@/modules/notification/presentation/dtos/list-notifications.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly listMyNotificationsUseCase: ListMyNotificationsUseCase,
    private readonly markAsReadUseCase: MarkAsReadUseCase,
    private readonly markAllAsReadUseCase: MarkAllAsReadUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List my notifications' })
  async list(@GetMe('id') userId: string, @Query() query: ListNotificationsDto) {
    const result = await this.listMyNotificationsUseCase.execute(
      userId,
      query.page ?? 1,
      query.limit ?? 10,
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
    const result = await this.markAsReadUseCase.execute(userId, notificationId);
    return ApiResponse.ok(result, 'Notification marked as read');
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all my notifications as read' })
  async markAllAsRead(@GetMe('id') userId: string) {
    await this.markAllAsReadUseCase.execute(userId);
    return ApiResponse.ok(null, 'All notifications marked as read');
  }
}
