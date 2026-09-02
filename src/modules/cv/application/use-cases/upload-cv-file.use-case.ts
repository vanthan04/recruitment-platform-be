import { Injectable } from '@nestjs/common';
import { ICvRepository } from '@/modules/cv/domain/repositories/cv.repository';
import { FileUploadService } from '@/modules/file-upload/application/file-upload.service';
import { EntityNotFoundException } from '@/common/exceptions/domain.exception';
import { CvResponseMapper } from '@/modules/cv/application/mappers/cv-response.mapper';
import { CvResponseDto } from '@/modules/cv/application/dto/cv-response.dto';

const ALLOWED_CV_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

@Injectable()
export class UploadCvFileUseCase {
  constructor(
    private readonly cvRepository: ICvRepository,
    private readonly fileUploadService: FileUploadService,
  ) {}

  async execute(userId: string, cvId: string, file: Express.Multer.File): Promise<CvResponseDto> {
    const cv = await this.cvRepository.findByIdWithRelations(cvId);
    if (!cv) {
      throw new EntityNotFoundException('CV', cvId);
    }

    cv.ensureOwner(userId);

    const { url } = await this.fileUploadService.uploadFile(file, 'cvs', ALLOWED_CV_FILE_TYPES);
    cv.attachFile(url);

    const updated = await this.cvRepository.update(cv);
    return CvResponseMapper.toDto(updated);
  }
}
