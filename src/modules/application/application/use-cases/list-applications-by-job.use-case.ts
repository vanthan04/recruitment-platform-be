import { Injectable } from '@nestjs/common';
import { IJobApplicationRepository } from '@/modules/application/domain/repositories/job-application.repository';
import { IJobRepository } from '@/modules/job/domain/repositories/job.repository';
import { EntityNotFoundException, UnauthorizedDomainException } from '@/common/exceptions/domain.exception';
import { ApplicationResponseMapper } from '@/modules/application/application/mappers/application-response.mapper';
import { ApplicationResponseDto } from '@/modules/application/application/dto/application-response.dto';

@Injectable()
export class ListApplicationsByJobUseCase {
  constructor(
    private readonly applicationRepository: IJobApplicationRepository,
    private readonly jobRepository: IJobRepository,
  ) {}

  async execute(recruiterId: string, jobId: string): Promise<ApplicationResponseDto[]> {
    const job = await this.jobRepository.findById(jobId);
    if (!job) throw new EntityNotFoundException('Job', jobId);

    if (job.postedById !== recruiterId) {
      throw new UnauthorizedDomainException('Only the job poster can view applications');
    }

    const apps = await this.applicationRepository.findAllByJobId(jobId);
    return ApplicationResponseMapper.toDtoList(apps);
  }
}
