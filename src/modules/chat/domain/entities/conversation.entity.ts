import { BaseEntity } from '@/common/domain/base.entity';
import { ConversationStatus } from '@/modules/chat/domain/value-objects/conversation-status.vo';
import { UnauthorizedDomainException } from '@/common/exceptions/domain.exception';

/**
 * Conversation Aggregate Root.
 * Framework-agnostic — no NestJS or Prisma imports.
 *
 * A conversation always has exactly two fixed participants — the candidate
 * and the recruiter of the JobApplication it originated from — denormalized
 * directly onto the aggregate so membership checks don't need a join.
 */
export class Conversation extends BaseEntity {
  jobId: string;
  applicationId: string;
  candidateId: string;
  recruiterId: string;
  status: ConversationStatus;
  lastMessageAt: Date | null;

  constructor(partial: Partial<Conversation>) {
    super();
    Object.assign(this, partial);
    this.status = partial.status ?? ConversationStatus.ACTIVE;
    this.lastMessageAt = partial.lastMessageAt ?? null;
  }

  isMember(userId: string): boolean {
    return this.candidateId === userId || this.recruiterId === userId;
  }

  ensureMember(userId: string): void {
    if (!this.isMember(userId)) {
      throw new UnauthorizedDomainException(
        'You are not a participant in this conversation',
      );
    }
  }

  otherParticipantId(userId: string): string {
    this.ensureMember(userId);
    return this.candidateId === userId ? this.recruiterId : this.candidateId;
  }

  touch(at: Date = new Date()): void {
    this.lastMessageAt = at;
  }
}
