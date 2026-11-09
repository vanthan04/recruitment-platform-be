import { Injectable } from '@nestjs/common';
import { IInterviewSessionRepository } from '@/modules/interview/domain/repositories/interview-session.repository';
import { InterviewSession } from '@/modules/interview/domain/entities/interview-session.entity';
import { InterviewSessionAlreadyOpenException } from '@/modules/interview/domain/exceptions/interview.exceptions';
import { InterviewSessionPrismaRepository } from '@/modules/interview/infrastructure/persistence/prisma/interview-session-prisma.repository';
import { InterviewSessionMapper } from '@/modules/interview/infrastructure/persistence/mappers/interview-session.mapper';
import {
  isUniqueConstraintViolation,
  uniqueConstraintName,
} from '@/common/utils/prisma-error.util';

const OPEN_SESSION_INDEX = 'interview_sessions_open_unique';

@Injectable()
export class InterviewSessionInfraRepository implements IInterviewSessionRepository {
  constructor(private readonly prisma: InterviewSessionPrismaRepository) {}

  async findById(id: string): Promise<InterviewSession | null> {
    return InterviewSessionMapper.toDomain(await this.prisma.findById(id));
  }

  async findByInterviewId(interviewId: string): Promise<InterviewSession[]> {
    const raws = await this.prisma.findByInterviewId(interviewId);
    return raws.map((r) => InterviewSessionMapper.toDomain(r)!);
  }

  async findOpenByInterviewId(
    interviewId: string,
  ): Promise<InterviewSession | null> {
    return InterviewSessionMapper.toDomain(
      await this.prisma.findOpenByInterviewId(interviewId),
    );
  }

  async save(session: InterviewSession): Promise<InterviewSession> {
    try {
      const raw = await this.prisma.create(
        InterviewSessionMapper.toPersistence(session),
      );
      return InterviewSessionMapper.toDomain(raw)!;
    } catch (err) {
      // A concurrent start passed the handler's pre-check; the partial unique
      // index is the real guard. Only translate that index: any other unique
      // violation is a genuine bug and must surface as such.
      if (
        isUniqueConstraintViolation(err) &&
        uniqueConstraintName(err) === OPEN_SESSION_INDEX
      ) {
        throw new InterviewSessionAlreadyOpenException();
      }
      throw err;
    }
  }

  async update(session: InterviewSession): Promise<InterviewSession> {
    const raw = await this.prisma.update(session.id, {
      endedAt: session.endedAt,
    });
    return InterviewSessionMapper.toDomain(raw)!;
  }
}
