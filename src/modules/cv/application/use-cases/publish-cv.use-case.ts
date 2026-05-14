import { Injectable } from '@nestjs/common';
import { ICvRepository } from '@/modules/cv/domain/repositories/cv.repository';
import { EntityNotFoundException } from '@/common/exceptions/domain.exception';
import { CvResponseMapper } from '@/modules/cv/application/mappers/cv-response.mapper';
import { CvResponseDto } from '@/modules/cv/application/dto/cv-response.dto';

@Injectable()
export class PublishCvUseCase {
  constructor(private readonly cvRepository: ICvRepository) {}

  async execute(userId: string, cvId: string): Promise<CvResponseDto> {
    const cv = await this.cvRepository.findByIdWithRelations(cvId);
    if (!cv) {
      throw new EntityNotFoundException('CV', cvId);
    }

    // Domain guards
    cv.ensureOwner(userId);

    // Business logic lives in the entity
    cv.publish();

    const updated = await this.cvRepository.update(cv);
    return CvResponseMapper.toDto(updated);
  }
}
