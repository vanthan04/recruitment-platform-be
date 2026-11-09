import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  INTERVIEW_ROOM_CLOSED_EVENT,
  InterviewRoomClosedEvent,
} from '@/modules/interview/infrastructure/events/interview-room-closed.event';
import { IInterviewScheduleRepository } from '@/modules/interview/domain/repositories/interview-schedule.repository';
import { InterviewSchedule } from '@/modules/interview/domain/entities/interview-schedule.entity';
import { InterviewSchedulePrismaRepository } from '@/modules/interview/infrastructure/persistence/prisma/interview-schedule-prisma.repository';
import { InterviewScheduleMapper } from '@/modules/interview/infrastructure/persistence/mappers/interview-schedule.mapper';

@Injectable()
export class InterviewScheduleInfraRepository implements IInterviewScheduleRepository {
  constructor(
    private readonly interviewPrisma: InterviewSchedulePrismaRepository,
    private readonly events: EventEmitter2,
  ) {}

  async findById(id: string): Promise<InterviewSchedule | null> {
    const raw = await this.interviewPrisma.findById(id);
    return InterviewScheduleMapper.toDomain(raw);
  }

  async findByApplicationId(
    jobApplicationId: string,
  ): Promise<InterviewSchedule[]> {
    const raws =
      await this.interviewPrisma.findByApplicationId(jobApplicationId);
    return raws.map((r) => InterviewScheduleMapper.toDomain(r)!);
  }

  async save(interview: InterviewSchedule): Promise<InterviewSchedule> {
    const data = InterviewScheduleMapper.toPersistence(interview);
    const raw = await this.interviewPrisma.create(data);
    return InterviewScheduleMapper.toDomain(raw)!;
  }

  async findUnremindedStartingBetween(
    from: Date,
    to: Date,
    limit: number,
  ): Promise<InterviewSchedule[]> {
    const raws = await this.interviewPrisma.findUnremindedStartingBetween(
      from,
      to,
      limit,
    );
    return raws.map((r) => InterviewScheduleMapper.toDomain(r)!);
  }

  async claimReminder(
    id: string,
    scheduledAt: Date,
    at: Date,
  ): Promise<boolean> {
    return (
      (await this.interviewPrisma.claimReminder(id, scheduledAt, at)) === 1
    );
  }

  async update(interview: InterviewSchedule): Promise<InterviewSchedule> {
    const data = InterviewScheduleMapper.toPersistence(interview);
    const raw = await this.interviewPrisma.update(interview.id, data);
    // A finished/cancelled interview had its open session closed in the same
    // transaction (see InterviewSchedulePrismaRepository.update) — tell the room.
    if (!interview.isActive()) {
      this.events.emit(
        INTERVIEW_ROOM_CLOSED_EVENT,
        new InterviewRoomClosedEvent(interview.id),
      );
    }
    return InterviewScheduleMapper.toDomain(raw)!;
  }
}
