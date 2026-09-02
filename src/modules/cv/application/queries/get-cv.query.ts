import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { ICvRepository } from '@/modules/cv/domain/repositories/cv.repository';
import { CvNotFoundException } from '@/modules/cv/domain/exceptions/cv.exceptions';
import { CvResponseMapper } from '@/modules/cv/application/mappers/cv-response.mapper';
import { CvResponseDto } from '@/modules/cv/application/dto/cv-response.dto';

export class GetCvQuery {
  constructor(public readonly cvId: string) {}
}

@Injectable()
@QueryHandler(GetCvQuery)
export class GetCvHandler implements IQueryHandler<GetCvQuery, CvResponseDto> {
  constructor(private readonly cvRepository: ICvRepository) {}

  async execute({ cvId }: GetCvQuery): Promise<CvResponseDto> {
    const cv = await this.cvRepository.findByIdWithRelations(cvId);
    if (!cv) {
      throw new CvNotFoundException(cvId);
    }

    return CvResponseMapper.toDto(cv);
  }
}
