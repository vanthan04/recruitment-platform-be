import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { EntityNotFoundException } from '@/common/exceptions/domain.exception';

export class DeleteJobCommand {
  constructor(
    public readonly recruiterId: string,
    public readonly jobId: string,
  ) {}
}

@Injectable()
@CommandHandler(DeleteJobCommand)
export class DeleteJobHandler implements ICommandHandler<
  DeleteJobCommand,
  void
> {
  constructor(private readonly jobRepository: IJobRepository) {}

  async execute({ recruiterId, jobId }: DeleteJobCommand): Promise<void> {
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      throw new EntityNotFoundException('Job', jobId);
    }

    job.ensureOwner(recruiterId);
    job.softDelete();

    await this.jobRepository.update(job);
  }
}
