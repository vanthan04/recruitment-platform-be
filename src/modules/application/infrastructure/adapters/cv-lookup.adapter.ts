import { Injectable } from '@nestjs/common';
import { ICvLookupPort, CvLookupResult } from '@/modules/application/application/ports/cv-lookup.port';
import { ICvRepository } from '@/modules/cv/domain/repositories/cv.repository';

@Injectable()
export class CvLookupAdapter implements ICvLookupPort {
  constructor(private readonly cvRepository: ICvRepository) {}

  async findById(cvId: string): Promise<CvLookupResult | null> {
    const cv = await this.cvRepository.findById(cvId);
    if (!cv) return null;

    return {
      id: cv.id,
      userId: cv.userId,
      isPublished: cv.isPublished,
      isDeleted: cv.isDeleted,
    };
  }
}
