import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionGuard } from '@/common/guards/permission.guard';
import { RequirePermissions } from '@/common/decorators/require-permissions.decorator';
import { GetMe } from '@/common/decorators/get-me.decorator';
import { Permission } from '@/common/enums/permission.enum';
import { ApiResponse } from '@/common/dtos/api-response';

import { CreateConversationCommand } from '@/modules/chat/application/commands/create-conversation.command';
import { CreateMessageCommand } from '@/modules/chat/application/commands/create-message.command';
import { MarkConversationReadCommand } from '@/modules/chat/application/commands/mark-conversation-read.command';
import { ListMyConversationsQuery } from '@/modules/chat/application/queries/list-my-conversations.query';
import { GetConversationQuery } from '@/modules/chat/application/queries/get-conversation.query';
import { ListMessagesQuery } from '@/modules/chat/application/queries/list-messages.query';

import { CreateConversationDto } from '@/modules/chat/presentation/dtos/create-conversation.dto';
import { CreateMessageDto } from '@/modules/chat/presentation/dtos/create-message.dto';
import { ListMessagesDto } from '@/modules/chat/presentation/dtos/list-messages.dto';
import { ListConversationsDto } from '@/modules/chat/presentation/dtos/list-conversations.dto';

@ApiTags('conversations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('conversations')
export class ConversationController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @RequirePermissions(Permission.CONVERSATION_CREATE)
  @ApiOperation({
    summary:
      'Start (or resume) the conversation for an accepted application (Recruiter only)',
  })
  async create(
    @GetMe('id') recruiterId: string,
    @Body() dto: CreateConversationDto,
  ) {
    const result = await this.commandBus.execute(
      new CreateConversationCommand(recruiterId, dto.applicationId),
    );
    return ApiResponse.ok(result, 'Conversation ready');
  }

  @Get()
  @ApiOperation({ summary: 'List my conversations' })
  async list(
    @GetMe('id') userId: string,
    @Query() query: ListConversationsDto,
  ) {
    const result = await this.queryBus.execute(
      new ListMyConversationsQuery(userId, query.page ?? 1, query.limit ?? 10),
    );
    return ApiResponse.ok(
      result.conversations,
      'Conversations retrieved successfully',
      {
        total: result.total,
        page: result.page,
        limit: result.limit,
      },
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one conversation (member only)' })
  async getOne(@GetMe('id') userId: string, @Param('id') id: string) {
    const result = await this.queryBus.execute(
      new GetConversationQuery(userId, id),
    );
    return ApiResponse.ok(result, 'Conversation retrieved successfully');
  }

  @Get(':id/messages')
  @ApiOperation({
    summary: 'Paginate messages, newest page first (member only)',
  })
  async listMessages(
    @GetMe('id') userId: string,
    @Param('id') id: string,
    @Query() query: ListMessagesDto,
  ) {
    const result = await this.queryBus.execute(
      new ListMessagesQuery(userId, id, query.cursor, query.limit ?? 30),
    );
    return ApiResponse.ok(result.items, 'Messages retrieved successfully', {
      nextCursor: result.nextCursor,
    });
  }

  @Post(':id/messages')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Send a message (member only)' })
  async sendMessage(
    @GetMe('id') userId: string,
    @Param('id') id: string,
    @Body() dto: CreateMessageDto,
  ) {
    const result = await this.commandBus.execute(
      new CreateMessageCommand(
        userId,
        id,
        dto.clientMessageId,
        dto.content,
        dto.messageType,
        dto.attachments ?? [],
      ),
    );
    return ApiResponse.ok(result, 'Message sent');
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark a conversation as read up to now (member only)',
  })
  async markRead(@GetMe('id') userId: string, @Param('id') id: string) {
    await this.commandBus.execute(new MarkConversationReadCommand(userId, id));
    return ApiResponse.ok(null, 'Conversation marked as read');
  }
}
