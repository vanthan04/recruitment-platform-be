import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { EntityNotFoundException } from '@/common/exceptions/domain.exception';
import { JobResponseMapper } from '@/modules/job/application/mappers/job-response.mapper';
import { JobResponseDto } from '@/modules/job/application/dto/job-response.dto';

export class ReopenJobCommand {
  constructor(
    public readonly recruiterId: string,
    public readonly jobId: string,
  ) {}
}

@Injectable()
@CommandHandler(ReopenJobCommand)
export class ReopenJobHandler implements ICommandHandler<
  ReopenJobCommand,
  JobResponseDto
> {
  constructor(private readonly jobRepository: IJobRepository) {}

  async execute({
    recruiterId,
    jobId,
  }: ReopenJobCommand): Promise<JobResponseDto> {
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      throw new EntityNotFoundException('Job', jobId);
    }

    job.ensureOwner(recruiterId);
    job.reopen();

    const updated = await this.jobRepository.update(job);
    return JobResponseMapper.toDto(updated);
  }
}
