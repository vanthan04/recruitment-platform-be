import { Injectable } from '@nestjs/common';
import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import {
  DetectionEventFilter,
  IDetectionEventRepository,
} from '@/modules/monitoring/domain/repositories/detection-event.repository';
import { IMonitoringInterviewAccessPort } from '@/modules/monitoring/application/ports/interview-access.port';
import {
  DetectionEventResponseDto,
  toDetectionEventDto,
} from '@/modules/monitoring/application/dto/detection-event-response.dto';
import { requireParticipant } from '@/modules/monitoring/application/utils/require-participant.util';

export interface ListDetectionEventsResult {
  events: DetectionEventResponseDto[];
  total: number;
  page: number;
  limit: number;
}

export class ListDetectionEventsQuery extends Query<ListDetectionEventsResult> {
  constructor(
    public readonly requesterId: string,
    public readonly interviewId: string,
    public readonly filter: DetectionEventFilter,
    public readonly page: number,
    public readonly limit: number,
  ) {
    super();
  }
}

/** Timeline of an interview's monitoring events, for its candidate and the job's recruiter. */
@Injectable()
@QueryHandler(ListDetectionEventsQuery)
export class ListDetectionEventsHandler implements IQueryHandler<
  ListDetectionEventsQuery,
  ListDetectionEventsResult
> {
  constructor(
    private readonly events: IDetectionEventRepository,
    private readonly access: IMonitoringInterviewAccessPort,
  ) {}

  async execute({
    requesterId,
    interviewId,
    filter,
    page,
    limit,
  }: ListDetectionEventsQuery): Promise<ListDetectionEventsResult> {
    const role = await requireParticipant(
      this.access,
      interviewId,
      requesterId,
    );
    const { items, total } = await this.events.listForInterview(
      interviewId,
      filter,
      page,
      limit,
    );
    return {
      events: items.map((e) => toDetectionEventDto(e, role)),
      total,
      page,
      limit,
    };
  }
}
