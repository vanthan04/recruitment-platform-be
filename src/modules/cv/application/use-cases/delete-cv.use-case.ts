import { Injectable } from '@nestjs/common';
import { ICvRepository } from '@/modules/cv/domain/repositories/cv.repository';
import { EntityNotFoundException } from '@/common/exceptions/domain.exception';

@Injectable()
export class DeleteCvUseCase {
  constructor(private readonly cvRepository: ICvRepository) {}

  async execute(userId: string, cvId: string): Promise<void> {
    const cv = await this.cvRepository.findById(cvId);
    if (!cv) {
      throw new EntityNotFoundException('CV', cvId);
    }

    // Domain guard: ensure ownership
    cv.ensureOwner(userId);

    // Soft delete via domain entity
    cv.softDelete();

    await this.cvRepository.update(cv);
  }
}
