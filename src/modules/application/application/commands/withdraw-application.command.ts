import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler, Command } from '@nestjs/cqrs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  APPLICATION_WITHDRAWN_EVENT,
  ApplicationWithdrawnEvent,
} from '@/modules/application/infrastructure/events/application-withdrawn.event';
import { IJobApplicationRepository } from '@/modules/application/domain/repositories/job-application.repository';
import {
  JobApplicationNotFoundException,
  ApplicationOwnershipException,
} from '@/modules/application/domain/exceptions/application.exceptions';
import { ApplicationResponseMapper } from '@/modules/application/application/mappers/application-response.mapper';
import { ApplicationResponseDto } from '@/modules/application/application/dto/application-response.dto';

export class WithdrawApplicationCommand extends Command<ApplicationResponseDto> {
  constructor(
    public readonly userId: string,
    public readonly applicationId: string,
  ) {
    super();
  }
}

@Injectable()
@CommandHandler(WithdrawApplicationCommand)
export class WithdrawApplicationHandler implements ICommandHandler<
  WithdrawApplicationCommand,
  ApplicationResponseDto
> {
  constructor(
    private readonly applicationRepository: IJobApplicationRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute({
    userId,
    applicationId,
  }: WithdrawApplicationCommand): Promise<ApplicationResponseDto> {
    const application =
      await this.applicationRepository.findById(applicationId);
    if (!application) {
      throw new JobApplicationNotFoundException(applicationId);
    }

    if (application.userId !== userId) {
      throw new ApplicationOwnershipException();
    }

    const fromStatus = application.status;
    application.withdraw();

    const updated = await this.applicationRepository.updateWithStatusHistory(
      application,
      {
        applicationId: application.id,
        fromStatus,
        toStatus: application.status,
        changedById: userId,
        note: null,
      },
    );

    // After the atomic update — never announce a withdrawal that didn't commit.
    this.eventEmitter.emit(
      APPLICATION_WITHDRAWN_EVENT,
      new ApplicationWithdrawnEvent(updated.id, updated.userId, updated.jobId),
    );

    return ApplicationResponseMapper.toDto(updated);
  }
}
