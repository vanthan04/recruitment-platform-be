import { IChatApplicationLookupPort } from '@/modules/chat/application/ports/application-lookup.port';
import { isChatClosedApplicationStatus } from '@/modules/chat/domain/value-objects/chat-eligible-application-status.vo';
import {
  ChatApplicationNotFoundException,
  ConversationClosedException,
} from '@/modules/chat/domain/exceptions/chat.exceptions';

/**
 * Guards anything that adds to a conversation (send, edit): refuses once the
 * application it belongs to has ended in REJECTED/WITHDRAWN.
 *
 * The status is read from the application every time rather than copied onto
 * the conversation — a copy would need a listener on every status change (and
 * a backfill for conversations that already exist) and could drift; one
 * primary-key lookup per write can't.
 */
export async function ensureConversationOpen(
  applicationLookup: IChatApplicationLookupPort,
  applicationId: string,
): Promise<void> {
  const application = await applicationLookup.findById(applicationId);
  // A conversation is deleted with its application (onDelete: Cascade), so a
  // missing one means something is badly off — don't let a write through.
  if (!application) throw new ChatApplicationNotFoundException(applicationId);
  if (isChatClosedApplicationStatus(application.status)) {
    throw new ConversationClosedException();
  }
}
