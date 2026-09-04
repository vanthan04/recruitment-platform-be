import { Inject, Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { ICvRepository } from '@/modules/cv/domain/repositories/cv.repository';
import { ICvStoragePort } from '@/modules/cv/application/ports/cv-storage.port';
import {
  CvNotFoundException,
  CvDownloadAccessDeniedException,
} from '@/modules/cv/domain/exceptions/cv.exceptions';

export interface DownloadCvResult {
  url: string;
  expiresAt: Date;
}

const DOWNLOAD_URL_EXPIRY_SECONDS = 300;

export class DownloadCvQuery {
  constructor(
    public readonly requesterId: string,
    public readonly cvId: string,
  ) {}
}

@Injectable()
@QueryHandler(DownloadCvQuery)
export class DownloadCvHandler implements IQueryHandler<
  DownloadCvQuery,
  DownloadCvResult
> {
  constructor(
    private readonly cvRepository: ICvRepository,
    @Inject(ICvStoragePort)
    private readonly cvStorage: ICvStoragePort,
  ) {}

  async execute({
    requesterId,
    cvId,
  }: DownloadCvQuery): Promise<DownloadCvResult> {
    const cv = await this.cvRepository.findById(cvId);
    if (!cv) {
      throw new CvNotFoundException(cvId);
    }

    // Candidate downloading their own CV, or a recruiter who owns a Job that
    // a JobApplication referencing this CV was submitted to (never a general
    // "browse any candidate's CV" access).
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

    const url = await this.cvStorage.getDownloadUrl(
      cv.fileKey,
      cv.originalName,
    );

    return {
      url,
      expiresAt: new Date(Date.now() + DOWNLOAD_URL_EXPIRY_SECONDS * 1000),
    };
  }
}
