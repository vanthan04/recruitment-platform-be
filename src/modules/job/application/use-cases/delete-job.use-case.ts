import { Injectable } from '@nestjs/common';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { EntityNotFoundException } from '@/common/exceptions/domain.exception';

@Injectable()
export class DeleteJobUseCase {
  constructor(private readonly jobRepository: IJobRepository) {}

  async execute(recruiterId: string, jobId: string): Promise<void> {
    const job = await this.jobRepository.findById(jobId);
    if (!job) {
      throw new EntityNotFoundException('Job', jobId);
    }

    job.ensureOwner(recruiterId);
    job.softDelete();

    await this.jobRepository.update(job);
  }
}
