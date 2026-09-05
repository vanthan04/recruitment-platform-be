import {
  EntityNotFoundException,
  BusinessRuleViolationException,
  UnauthorizedDomainException,
} from '@/common/exceptions/domain.exception';

/**
 * Chat-module domain exceptions. See auth/cv/job modules for the
 * pattern: each carries a module-specific `code` while staying an
 * `instanceof` of the shared category so GlobalExceptionFilter still
 * resolves the right HTTP status.
 */

export class ConversationNotFoundException extends EntityNotFoundException {
  constructor(id?: string) {
    super('Conversation', id, 'CHAT_CONVERSATION_NOT_FOUND');
    this.name = 'ConversationNotFoundException';
  }
}

export class MessageNotFoundException extends EntityNotFoundException {
  constructor(id?: string) {
    super('Message', id, 'CHAT_MESSAGE_NOT_FOUND');
    this.name = 'MessageNotFoundException';
  }
}

/** The JobApplication a new conversation is started from. */
export class ChatApplicationNotFoundException extends EntityNotFoundException {
  constructor(id?: string) {
    super('Application', id, 'CHAT_APPLICATION_NOT_FOUND');
    this.name = 'ChatApplicationNotFoundException';
  }
}

/** The Job the referenced application belongs to. */
export class ChatJobNotFoundException extends EntityNotFoundException {
  constructor(id?: string) {
    super('Job', id, 'CHAT_JOB_NOT_FOUND');
    this.name = 'ChatJobNotFoundException';
  }
}

export class ApplicationNotAcceptedException extends BusinessRuleViolationException {
  constructor() {
    super(
      'A conversation can only be started for an accepted application',
      'CHAT_APPLICATION_NOT_ACCEPTED',
    );
    this.name = 'ApplicationNotAcceptedException';
  }
}

export class NotConversationMemberException extends UnauthorizedDomainException {
  constructor() {
    super('You are not a participant in this conversation', 'CHAT_NOT_MEMBER');
    this.name = 'NotConversationMemberException';
  }
}

export class NotMessageSenderException extends UnauthorizedDomainException {
  constructor() {
    super('Only the sender can modify this message', 'CHAT_NOT_SENDER');
    this.name = 'NotMessageSenderException';
  }
}

export class SystemMessageNotAllowedException extends BusinessRuleViolationException {
  constructor() {
    super(
      'System messages cannot be sent by a user',
      'CHAT_SYSTEM_MESSAGE_NOT_ALLOWED',
    );
    this.name = 'SystemMessageNotAllowedException';
  }
}

export class TooManyAttachmentsException extends BusinessRuleViolationException {
  constructor(max: number) {
    super(
      `A message can have at most ${max} attachments`,
      'CHAT_TOO_MANY_ATTACHMENTS',
    );
    this.name = 'TooManyAttachmentsException';
  }
}

export class InvalidAttachmentUrlException extends BusinessRuleViolationException {
  constructor() {
    super(
      'Attachment fileUrl must point to a file uploaded through this app',
      'CHAT_INVALID_ATTACHMENT_URL',
    );
    this.name = 'InvalidAttachmentUrlException';
  }
}

export class EmptyMessageException extends BusinessRuleViolationException {
  constructor() {
    super(
      'Message must have content or at least one attachment',
      'CHAT_EMPTY_MESSAGE',
    );
    this.name = 'EmptyMessageException';
  }
}

export class CannotEditDeletedMessageException extends BusinessRuleViolationException {
  constructor() {
    super('Cannot edit a deleted message', 'CHAT_EDIT_DELETED_MESSAGE');
    this.name = 'CannotEditDeletedMessageException';
  }
}

export class OnlyTextMessagesEditableException extends BusinessRuleViolationException {
  constructor() {
    super('Only text messages can be edited', 'CHAT_ONLY_TEXT_EDITABLE');
    this.name = 'OnlyTextMessagesEditableException';
  }
}

export class MessageContentEmptyException extends BusinessRuleViolationException {
  constructor() {
    super('Message content cannot be empty', 'CHAT_MESSAGE_CONTENT_EMPTY');
    this.name = 'MessageContentEmptyException';
  }
}

export class MessageAlreadyDeletedException extends BusinessRuleViolationException {
  constructor() {
    super('Message is already deleted', 'CHAT_MESSAGE_ALREADY_DELETED');
    this.name = 'MessageAlreadyDeletedException';
  }
}
