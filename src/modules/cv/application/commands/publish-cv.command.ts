import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ICvRepository } from '@/modules/cv/domain/repositories/cv.repository';
import { CvNotFoundException } from '@/modules/cv/domain/exceptions/cv.exceptions';
import { CvResponseMapper } from '@/modules/cv/application/mappers/cv-response.mapper';
import { CvResponseDto } from '@/modules/cv/application/dto/cv-response.dto';

export class PublishCvCommand {
  constructor(
    public readonly userId: string,
    public readonly cvId: string,
  ) {}
}

@Injectable()
@CommandHandler(PublishCvCommand)
export class PublishCvHandler implements ICommandHandler<
  PublishCvCommand,
  CvResponseDto
> {
  constructor(private readonly cvRepository: ICvRepository) {}

  async execute({ userId, cvId }: PublishCvCommand): Promise<CvResponseDto> {
    const cv = await this.cvRepository.findByIdWithRelations(cvId);
    if (!cv) {
      throw new CvNotFoundException(cvId);
    }

    cv.ensureOwner(userId);
    cv.publish();

    const updated = await this.cvRepository.update(cv);
    return CvResponseMapper.toDto(updated);
  }
}
