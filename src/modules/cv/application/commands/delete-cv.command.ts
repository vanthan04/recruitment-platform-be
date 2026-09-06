import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler, Command } from '@nestjs/cqrs';
import { ICvRepository } from '@/modules/cv/domain/repositories/cv.repository';
import {
  CvNotFoundException,
  CvReferencedByActiveApplicationException,
} from '@/modules/cv/domain/exceptions/cv.exceptions';

export class DeleteCvCommand extends Command<void> {
  constructor(
    public readonly userId: string,
    public readonly cvId: string,
  ) {
    super();
  }
}

@Injectable()
@CommandHandler(DeleteCvCommand)
export class DeleteCvHandler implements ICommandHandler<DeleteCvCommand, void> {
  constructor(private readonly cvRepository: ICvRepository) {}

  async execute({ userId, cvId }: DeleteCvCommand): Promise<void> {
    const cv = await this.cvRepository.findById(cvId);
    if (!cv) {
      throw new CvNotFoundException(cvId);
    }

    cv.ensureOwner(userId);

    if (await this.cvRepository.hasActiveApplicationReference(cvId)) {
      throw new CvReferencedByActiveApplicationException();
    }

    cv.softDelete();

    await this.cvRepository.update(cv);
  }
}
