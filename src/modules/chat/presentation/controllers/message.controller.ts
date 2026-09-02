import {
  Controller,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { GetMe } from '@/common/decorators/get-me.decorator';
import { ApiResponse } from '@/common/dtos/api-response';

import { EditMessageCommand } from '@/modules/chat/application/commands/edit-message.command';
import { DeleteMessageCommand } from '@/modules/chat/application/commands/delete-message.command';
import { EditMessageDto } from '@/modules/chat/presentation/dtos/edit-message.dto';

@ApiTags('messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessageController {
  constructor(private readonly commandBus: CommandBus) {}

  @Patch(':id')
  @ApiOperation({ summary: 'Edit a text message (sender only)' })
  async edit(
    @GetMe('id') userId: string,
    @Param('id') id: string,
    @Body() dto: EditMessageDto,
  ) {
    const result = await this.commandBus.execute(
      new EditMessageCommand(userId, id, dto.content),
    );
    return ApiResponse.ok(result, 'Message updated');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a message (sender only)' })
  async remove(@GetMe('id') userId: string, @Param('id') id: string) {
    const result = await this.commandBus.execute(
      new DeleteMessageCommand(userId, id),
    );
    return ApiResponse.ok(result, 'Message deleted');
  }
}
