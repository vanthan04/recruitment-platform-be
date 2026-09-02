import { Injectable } from '@nestjs/common';
import { IInterviewScheduleRepository } from '@/modules/interview/domain/repositories/interview-schedule.repository';
import { InterviewSchedule } from '@/modules/interview/domain/entities/interview-schedule.entity';
import { InterviewSchedulePrismaRepository } from '@/modules/interview/infrastructure/persistence/prisma/interview-schedule-prisma.repository';
import { InterviewScheduleMapper } from '@/modules/interview/infrastructure/persistence/mappers/interview-schedule.mapper';

@Injectable()
export class InterviewScheduleInfraRepository implements IInterviewScheduleRepository {
  constructor(private readonly interviewPrisma: InterviewSchedulePrismaRepository) {}

  async findById(id: string): Promise<InterviewSchedule | null> {
    const raw = await this.interviewPrisma.findById(id);
    return InterviewScheduleMapper.toDomain(raw);
  }

  async findByApplicationId(jobApplicationId: string): Promise<InterviewSchedule[]> {
    const raws = await this.interviewPrisma.findByApplicationId(jobApplicationId);
    return raws.map((r) => InterviewScheduleMapper.toDomain(r)!);
  }

  async save(interview: InterviewSchedule): Promise<InterviewSchedule> {
    const data = InterviewScheduleMapper.toPersistence(interview);
    const raw = await this.interviewPrisma.create(data);
    return InterviewScheduleMapper.toDomain(raw)!;
  }

  async update(interview: InterviewSchedule): Promise<InterviewSchedule> {
    const data = InterviewScheduleMapper.toPersistence(interview);
    const raw = await this.interviewPrisma.update(interview.id, data);
    return InterviewScheduleMapper.toDomain(raw)!;
  }
}
