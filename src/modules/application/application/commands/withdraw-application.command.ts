import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IJobApplicationRepository } from '@/modules/application/domain/repositories/job-application.repository';
import {
  EntityNotFoundException,
  UnauthorizedDomainException,
} from '@/common/exceptions/domain.exception';
import { ApplicationResponseMapper } from '@/modules/application/application/mappers/application-response.mapper';
import { ApplicationResponseDto } from '@/modules/application/application/dto/application-response.dto';

export class WithdrawApplicationCommand {
  constructor(
    public readonly userId: string,
    public readonly applicationId: string,
  ) {}
}

@Injectable()
@CommandHandler(WithdrawApplicationCommand)
export class WithdrawApplicationHandler implements ICommandHandler<
  WithdrawApplicationCommand,
  ApplicationResponseDto
> {
  constructor(
    private readonly applicationRepository: IJobApplicationRepository,
  ) {}

  async execute({
    userId,
    applicationId,
  }: WithdrawApplicationCommand): Promise<ApplicationResponseDto> {
    const application =
      await this.applicationRepository.findById(applicationId);
    if (!application) {
      throw new EntityNotFoundException('Application', applicationId);
    }

    if (application.userId !== userId) {
      throw new UnauthorizedDomainException(
        'You are not the owner of this application',
      );
    }

    application.withdraw();

    const updated = await this.applicationRepository.update(application);
    return ApplicationResponseMapper.toDto(updated);
  }
}
