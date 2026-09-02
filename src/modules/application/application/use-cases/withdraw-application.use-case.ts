import { Injectable } from '@nestjs/common';
import { IJobApplicationRepository } from '@/modules/application/domain/repositories/job-application.repository';
import { EntityNotFoundException, UnauthorizedDomainException } from '@/common/exceptions/domain.exception';
import { ApplicationResponseMapper } from '@/modules/application/application/mappers/application-response.mapper';
import { ApplicationResponseDto } from '@/modules/application/application/dto/application-response.dto';

@Injectable()
export class WithdrawApplicationUseCase {
  constructor(private readonly applicationRepository: IJobApplicationRepository) {}

  async execute(userId: string, applicationId: string): Promise<ApplicationResponseDto> {
    const application = await this.applicationRepository.findById(applicationId);
    if (!application) {
      throw new EntityNotFoundException('Application', applicationId);
    }

    if (application.userId !== userId) {
      throw new UnauthorizedDomainException('You are not the owner of this application');
    }

    application.withdraw();

    const updated = await this.applicationRepository.update(application);
    return ApplicationResponseMapper.toDto(updated);
  }
}
