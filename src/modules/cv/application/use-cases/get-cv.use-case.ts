import { Injectable } from '@nestjs/common';
import { ICvRepository } from '@/modules/cv/domain/repositories/cv.repository';
import { EntityNotFoundException } from '@/common/exceptions/domain.exception';
import { CvResponseMapper } from '@/modules/cv/application/mappers/cv-response.mapper';
import { CvResponseDto } from '@/modules/cv/application/dto/cv-response.dto';

@Injectable()
export class GetCvUseCase {
  constructor(private readonly cvRepository: ICvRepository) {}

  async execute(cvId: string): Promise<CvResponseDto> {
    const cv = await this.cvRepository.findByIdWithRelations(cvId);
    if (!cv) {
      throw new EntityNotFoundException('CV', cvId);
    }

    return CvResponseMapper.toDto(cv);
  }
}
