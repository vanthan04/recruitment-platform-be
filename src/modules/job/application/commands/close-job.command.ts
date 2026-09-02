import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { JobNotFoundException } from '@/modules/job/domain/exceptions/job.exceptions';
import { JobResponseMapper } from '@/modules/job/application/mappers/job-response.mapper';
import { JobResponseDto } from '@/modules/job/application/dto/job-response.dto';

export class CloseJobCommand {
  constructor(
    public readonly recruiterId: string,
    public readonly jobId: string,
  ) {}
}

@Injectable()
@CommandHandler(CloseJobCommand)
export class CloseJobHandler implements ICommandHandler<
  CloseJobCommand,
  JobResponseDto
> {
  constructor(private readonly jobRepository: IJobRepository) {}

  async execute({
    recruiterId,
    jobId,
  }: CloseJobCommand): Promise<JobResponseDto> {
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      throw new JobNotFoundException(jobId);
    }

    job.ensureOwner(recruiterId);
    job.close();

    const updated = await this.jobRepository.update(job);
    return JobResponseMapper.toDto(updated);
  }
}
