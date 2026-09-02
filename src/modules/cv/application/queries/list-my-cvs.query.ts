import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { ICvRepository } from '@/modules/cv/domain/repositories/cv.repository';
import { CvResponseMapper } from '@/modules/cv/application/mappers/cv-response.mapper';
import { CvResponseDto } from '@/modules/cv/application/dto/cv-response.dto';

export class ListMyCvsQuery {
  constructor(public readonly userId: string) {}
}

@Injectable()
@QueryHandler(ListMyCvsQuery)
export class ListMyCvsHandler implements IQueryHandler<ListMyCvsQuery, CvResponseDto[]> {
  constructor(private readonly cvRepository: ICvRepository) {}

  async execute({ userId }: ListMyCvsQuery): Promise<CvResponseDto[]> {
    const cvs = await this.cvRepository.findAllByUserId(userId);
    return CvResponseMapper.toDtoList(cvs);
  }
}
