import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IConversationRepository } from '@/modules/chat/domain/repositories/conversation.repository';
import { IMessageRepository } from '@/modules/chat/domain/repositories/message.repository';
import { Conversation } from '@/modules/chat/domain/entities/conversation.entity';
import { ConversationMember } from '@/modules/chat/domain/entities/conversation-member.entity';
import { ChatParticipantRole } from '@/modules/chat/domain/value-objects/chat-participant-role.vo';
import { IChatApplicationLookupPort } from '@/modules/chat/application/ports/application-lookup.port';
import { IChatJobLookupPort } from '@/modules/chat/application/ports/job-lookup.port';
import { IChatUserLookupPort } from '@/modules/chat/application/ports/user-lookup.port';
import { ConversationResponseMapper } from '@/modules/chat/application/mappers/conversation-response.mapper';
import { ConversationResponseDto } from '@/modules/chat/application/dto/conversation-response.dto';
import {
  EntityNotFoundException,
  UnauthorizedDomainException,
  BusinessRuleViolationException,
} from '@/common/exceptions/domain.exception';

const ELIGIBLE_APPLICATION_STATUS = 'ACCEPTED';

export class CreateConversationCommand {
  constructor(
    public readonly recruiterId: string,
    public readonly applicationId: string,
  ) {}
}

@Injectable()
@CommandHandler(CreateConversationCommand)
export class CreateConversationHandler implements ICommandHandler<
  CreateConversationCommand,
  ConversationResponseDto
> {
  constructor(
    private readonly conversationRepository: IConversationRepository,
    private readonly messageRepository: IMessageRepository,
    private readonly applicationLookupPort: IChatApplicationLookupPort,
    private readonly jobLookupPort: IChatJobLookupPort,
    private readonly userLookupPort: IChatUserLookupPort,
  ) {}

  async execute({
    recruiterId,
    applicationId,
  }: CreateConversationCommand): Promise<ConversationResponseDto> {
    const application =
      await this.applicationLookupPort.findById(applicationId);
    if (!application)
      throw new EntityNotFoundException('Application', applicationId);

    if (application.status !== ELIGIBLE_APPLICATION_STATUS) {
      throw new BusinessRuleViolationException(
        'A conversation can only be started for an accepted application',
      );
    }

    const job = await this.jobLookupPort.findById(application.jobId);
    if (!job) throw new EntityNotFoundException('Job', application.jobId);

    if (job.postedById !== recruiterId) {
      throw new UnauthorizedDomainException(
        'Only the job poster can start this conversation',
      );
    }

    const conversation = new Conversation({
      jobId: job.id,
      applicationId: application.id,
      candidateId: application.userId,
      recruiterId,
    });

    const members = [
      new ConversationMember({
        conversationId: conversation.id,
        userId: application.userId,
        role: ChatParticipantRole.CANDIDATE,
      }),
      new ConversationMember({
        conversationId: conversation.id,
        userId: recruiterId,
        role: ChatParticipantRole.RECRUITER,
      }),
    ];

    const { conversation: saved } =
      await this.conversationRepository.findOrCreateForApplication(
        conversation,
        members,
      );

    const candidate = await this.userLookupPort.findById(saved.candidateId);

    return ConversationResponseMapper.toDto(saved, {
      jobTitle: job.title,
      applicationStatus: application.status,
      otherParticipant: candidate!,
      lastMessage: await this.messageRepository.findLastMessage(saved.id),
      unreadCount: 0,
    });
  }
}
