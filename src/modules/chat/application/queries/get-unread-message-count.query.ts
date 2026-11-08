import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler, Query } from '@nestjs/cqrs';
import { IMessageRepository } from '@/modules/chat/domain/repositories/message.repository';

export interface UnreadMessageCountResult {
  count: number;
}

export class GetUnreadMessageCountQuery extends Query<UnreadMessageCountResult> {
  constructor(public readonly userId: string) {
    super();
  }
}

/** Backs the unread badge on the "Tin nhắn" nav item. */
@Injectable()
@QueryHandler(GetUnreadMessageCountQuery)
export class GetUnreadMessageCountHandler implements IQueryHandler<
  GetUnreadMessageCountQuery,
  UnreadMessageCountResult
> {
  constructor(private readonly messageRepository: IMessageRepository) {}

  async execute({
    userId,
  }: GetUnreadMessageCountQuery): Promise<UnreadMessageCountResult> {
    return { count: await this.messageRepository.countUnreadForUser(userId) };
  }
}
