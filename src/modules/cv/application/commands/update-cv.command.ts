import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ICvRepository } from '@/modules/cv/domain/repositories/cv.repository';
import { CvNotFoundException } from '@/modules/cv/domain/exceptions/cv.exceptions';
import { CvResponseMapper } from '@/modules/cv/application/mappers/cv-response.mapper';
import { CvResponseDto } from '@/modules/cv/application/dto/cv-response.dto';

export interface UpdateCvInput {
  title?: string;
}

export class UpdateCvCommand {
  constructor(
    public readonly userId: string,
    public readonly cvId: string,
    public readonly input: UpdateCvInput,
  ) {}
}

@Injectable()
@CommandHandler(UpdateCvCommand)
export class UpdateCvHandler implements ICommandHandler<
  UpdateCvCommand,
  CvResponseDto
> {
  constructor(private readonly cvRepository: ICvRepository) {}

  async execute({
    userId,
    cvId,
    input,
  }: UpdateCvCommand): Promise<CvResponseDto> {
    const cv = await this.cvRepository.findById(cvId);
    if (!cv) {
      throw new CvNotFoundException(cvId);
    }

    cv.ensureOwner(userId);

    if (input.title !== undefined) {
      cv.updateTitle(input.title);
    }

    const updated = await this.cvRepository.update(cv);
    return CvResponseMapper.toDto(updated);
  }
}
