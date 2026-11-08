import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { OnEvent } from '@nestjs/event-emitter';
import { IConversationRepository } from '@/modules/chat/domain/repositories/conversation.repository';
import { Conversation } from '@/modules/chat/domain/entities/conversation.entity';
import { CreateSystemMessageCommand } from '@/modules/chat/application/commands/create-system-message.command';
import {
  applicationStatusChangedText,
  applicationStatusSystemMessageKey,
} from '@/modules/chat/application/utils/system-message-text.util';
import {
  APPLICATION_STATUS_CHANGED_EVENT,
  ApplicationStatusChangedEvent,
} from '@/modules/application/infrastructure/events/application-status-changed.event';
import {
  APPLICATION_WITHDRAWN_EVENT,
  ApplicationWithdrawnEvent,
} from '@/modules/application/infrastructure/events/application-withdrawn.event';

/**
 * Mirrors an application's status change into its conversation, if it has
 * one, so both people see in the chat what moved without leaving it.
 *
 * Two events feed it, because two different people can end an application:
 * - APPLICATION_STATUS_CHANGED_EVENT — the recruiter moved it. The line is
 *   attributed to the conversation's recruiter (only the job's owner can
 *   change a status, and the conversation's recruiter is that owner).
 * - APPLICATION_WITHDRAWN_EVENT — the candidate withdrew. Attributed to the
 *   candidate, so the *recruiter* is the one it counts as unread for.
 *   (APPLICATION_STATUS_CHANGED_EVENT can't carry this: it notifies the
 *   candidate, who would be told about their own action.)
 */
@Injectable()
export class ApplicationStatusSystemMessageListener {
  private readonly logger = new Logger(
    ApplicationStatusSystemMessageListener.name,
  );

  constructor(
    private readonly conversationRepository: IConversationRepository,
    private readonly commandBus: CommandBus,
  ) {}

  @OnEvent(APPLICATION_STATUS_CHANGED_EVENT)
  async handleStatusChanged(
    event: ApplicationStatusChangedEvent,
  ): Promise<void> {
    await this.postStatusLine(
      event.applicationId,
      event.status,
      (conversation) => conversation.recruiterId,
    );
  }

  @OnEvent(APPLICATION_WITHDRAWN_EVENT)
  async handleWithdrawn(event: ApplicationWithdrawnEvent): Promise<void> {
    await this.postStatusLine(
      event.applicationId,
      'WITHDRAWN',
      (conversation) => conversation.candidateId,
    );
  }

  private async postStatusLine(
    applicationId: string,
    status: string,
    actorOf: (conversation: Conversation) => string,
  ): Promise<void> {
    // Best-effort side effect: the status change itself already committed.
    // `emit()` doesn't await listeners, so a rejection here would be an
    // unhandled promise rejection and take the process down.
    try {
      const conversation =
        await this.conversationRepository.findByApplicationId(applicationId);
      if (!conversation) return; // no chat opened for this application

      await this.commandBus.execute(
        new CreateSystemMessageCommand(
          conversation.id,
          actorOf(conversation),
          applicationStatusChangedText(status),
          applicationStatusSystemMessageKey(applicationId, status),
        ),
      );
    } catch (err) {
      this.logger.error(
        `Failed to post status line for application ${applicationId} (${status})`,
        err instanceof Error ? err.stack : err,
      );
    }
  }
}
