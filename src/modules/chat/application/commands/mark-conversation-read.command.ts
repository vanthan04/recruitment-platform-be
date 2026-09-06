import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler, Command } from '@nestjs/cqrs';
import { IConversationRepository } from '@/modules/chat/domain/repositories/conversation.repository';
import { ConversationNotFoundException } from '@/modules/chat/domain/exceptions/chat.exceptions';

export class MarkConversationReadCommand extends Command<void> {
  constructor(
    public readonly userId: string,
    public readonly conversationId: string,
  ) {
    super();
  }
}

@Injectable()
@CommandHandler(MarkConversationReadCommand)
export class MarkConversationReadHandler implements ICommandHandler<
  MarkConversationReadCommand,
  void
> {
  constructor(
    private readonly conversationRepository: IConversationRepository,
  ) {}

  async execute({
    userId,
    conversationId,
  }: MarkConversationReadCommand): Promise<void> {
    const conversation =
      await this.conversationRepository.findById(conversationId);
    if (!conversation) throw new ConversationNotFoundException(conversationId);
    conversation.ensureMember(userId);

    await this.conversationRepository.markMemberRead(
      conversationId,
      userId,
      new Date(),
    );
  }
}
