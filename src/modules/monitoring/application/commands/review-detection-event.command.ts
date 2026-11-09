import { Injectable } from '@nestjs/common';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IDetectionEventRepository } from '@/modules/monitoring/domain/repositories/detection-event.repository';
import { IMonitoringInterviewAccessPort } from '@/modules/monitoring/application/ports/interview-access.port';
import {
  DetectionEventNotFoundException,
  DetectionEventReviewNotAllowedException,
} from '@/modules/monitoring/domain/exceptions/monitoring.exceptions';
import {
  DetectionEventResponseDto,
  toDetectionEventDto,
} from '@/modules/monitoring/application/dto/detection-event-response.dto';

export class ReviewDetectionEventCommand extends Command<DetectionEventResponseDto> {
  constructor(
    public readonly requesterId: string,
    public readonly eventId: string,
    public readonly note: string | null,
  ) {
    super();
  }
}

/**
 * The job's recruiter marks an event as reviewed, optionally with a private
 * note. Only the recruiter: a candidate can read events about themselves but
 * not review them; anyone else gets "not found" (an id must not reveal that
 * an event exists).
 */
@Injectable()
@CommandHandler(ReviewDetectionEventCommand)
export class ReviewDetectionEventHandler implements ICommandHandler<
  ReviewDetectionEventCommand,
  DetectionEventResponseDto
> {
  constructor(
    private readonly events: IDetectionEventRepository,
    private readonly access: IMonitoringInterviewAccessPort,
  ) {}

  async execute({
    requesterId,
    eventId,
    note,
  }: ReviewDetectionEventCommand): Promise<DetectionEventResponseDto> {
    const event = await this.events.findById(eventId);
    if (!event) throw new DetectionEventNotFoundException(eventId);

    const access = await this.access.resolveRole(
      event.interviewId,
      requesterId,
    );
    if (!access?.role) throw new DetectionEventNotFoundException(eventId);
    if (access.role !== 'RECRUITER') {
      throw new DetectionEventReviewNotAllowedException();
    }

    event.review(requesterId, note?.trim() || null);
    const saved = await this.events.saveReview(event);
    return toDetectionEventDto(saved, 'RECRUITER');
  }
}
