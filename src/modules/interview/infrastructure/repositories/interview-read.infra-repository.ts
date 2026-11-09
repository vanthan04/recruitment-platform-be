import { Injectable } from '@nestjs/common';
import {
  IInterviewReadRepository,
  InterviewListItem,
  ListInterviewsFilter,
} from '@/modules/interview/domain/repositories/interview-read.repository';
import {
  InterviewItemRaw,
  InterviewReadPrismaRepository,
} from '@/modules/interview/infrastructure/persistence/prisma/interview-read-prisma.repository';
import { InterviewScheduleMapper } from '@/modules/interview/infrastructure/persistence/mappers/interview-schedule.mapper';
import { normalizePagination } from '@/common/utils/pagination.util';

function toItem(raw: InterviewItemRaw): InterviewListItem {
  const { jobApplication, ...schedule } = raw;
  return {
    interview: InterviewScheduleMapper.toDomain(schedule)!,
    jobId: jobApplication.jobId,
    jobTitle: jobApplication.job.title,
    candidateId: jobApplication.userId,
    candidateName: jobApplication.user.profile?.fullName ?? null,
    recruiterId: jobApplication.job.postedById,
    applicationStatus: jobApplication.status,
  };
}

@Injectable()
export class InterviewReadInfraRepository implements IInterviewReadRepository {
  constructor(private readonly prisma: InterviewReadPrismaRepository) {}

  async findItemById(id: string): Promise<InterviewListItem | null> {
    const raw = await this.prisma.findItemById(id);
    return raw ? toItem(raw) : null;
  }

  async findForParticipant(
    filter: ListInterviewsFilter,
  ): Promise<{ items: InterviewListItem[]; total: number }> {
    const { skip, limit } = normalizePagination(filter);
    const { items, total } = await this.prisma.findForParticipant({
      userId: filter.userId,
      status: filter.status,
      upcoming: filter.upcoming,
      skip,
      take: limit,
    });
    return { items: items.map(toItem), total };
  }
}
