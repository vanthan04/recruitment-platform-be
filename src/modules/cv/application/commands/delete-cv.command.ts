import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ICvRepository } from '@/modules/cv/domain/repositories/cv.repository';
import { EntityNotFoundException } from '@/common/exceptions/domain.exception';

export class DeleteCvCommand {
  constructor(
    public readonly userId: string,
    public readonly cvId: string,
  ) {}
}

@Injectable()
@CommandHandler(DeleteCvCommand)
export class DeleteCvHandler implements ICommandHandler<DeleteCvCommand, void> {
  constructor(private readonly cvRepository: ICvRepository) {}

  async execute({ userId, cvId }: DeleteCvCommand): Promise<void> {
    const cv = await this.cvRepository.findById(cvId);
    if (!cv) {
      throw new EntityNotFoundException('CV', cvId);
    }

    cv.ensureOwner(userId);
    cv.softDelete();

    await this.cvRepository.update(cv);
  }
}
