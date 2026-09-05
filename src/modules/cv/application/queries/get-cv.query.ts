import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { ICvRepository } from '@/modules/cv/domain/repositories/cv.repository';
import {
  CvNotFoundException,
  CvDownloadAccessDeniedException,
} from '@/modules/cv/domain/exceptions/cv.exceptions';
import { CvResponseMapper } from '@/modules/cv/application/mappers/cv-response.mapper';
import { CvResponseDto } from '@/modules/cv/application/dto/cv-response.dto';

export class GetCvQuery {
  constructor(
    public readonly requesterId: string,
    public readonly cvId: string,
  ) {}
}

@Injectable()
@QueryHandler(GetCvQuery)
export class GetCvHandler implements IQueryHandler<GetCvQuery, CvResponseDto> {
  constructor(private readonly cvRepository: ICvRepository) {}

  async execute({ requesterId, cvId }: GetCvQuery): Promise<CvResponseDto> {
    const cv = await this.cvRepository.findById(cvId);
    if (!cv) {
      throw new CvNotFoundException(cvId);
    }

    // Same access rule as download: the owning candidate, or a recruiter
    // whose job a JobApplication referencing this CV was submitted to —
    // never a general "browse any candidate's CV" read.
    const isOwner = cv.userId === requesterId;
    if (!isOwner) {
      const hasRecruiterAccess = await this.cvRepository.hasRecruiterAccess(
        cvId,
        requesterId,
      );
      if (!hasRecruiterAccess) {
        throw new CvDownloadAccessDeniedException();
      }
    }

    return CvResponseMapper.toDto(cv);
  }
}
