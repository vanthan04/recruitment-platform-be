import { Injectable } from '@nestjs/common';
import { ICvRepository } from '@/modules/cv/domain/repositories/cv.repository';
import { CvResponseMapper } from '@/modules/cv/application/mappers/cv-response.mapper';
import { CvResponseDto } from '@/modules/cv/application/dto/cv-response.dto';

@Injectable()
export class ListMyCvsUseCase {
  constructor(private readonly cvRepository: ICvRepository) {}

  async execute(userId: string): Promise<CvResponseDto[]> {
    const cvs = await this.cvRepository.findAllByUserId(userId);
    return CvResponseMapper.toDtoList(cvs);
  }
}
