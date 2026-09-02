import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ICvRepository } from '@/modules/cv/domain/repositories/cv.repository';
import { IFileUploadPort } from '@/modules/cv/application/ports/file-upload.port';
import { CvNotFoundException } from '@/modules/cv/domain/exceptions/cv.exceptions';
import { CvResponseMapper } from '@/modules/cv/application/mappers/cv-response.mapper';
import { CvResponseDto } from '@/modules/cv/application/dto/cv-response.dto';

const ALLOWED_CV_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export class UploadCvFileCommand {
  constructor(
    public readonly userId: string,
    public readonly cvId: string,
    public readonly file: Express.Multer.File,
  ) {}
}

@Injectable()
@CommandHandler(UploadCvFileCommand)
export class UploadCvFileHandler implements ICommandHandler<
  UploadCvFileCommand,
  CvResponseDto
> {
  constructor(
    private readonly cvRepository: ICvRepository,
    private readonly fileUploadPort: IFileUploadPort,
  ) {}

  async execute({
    userId,
    cvId,
    file,
  }: UploadCvFileCommand): Promise<CvResponseDto> {
    const cv = await this.cvRepository.findByIdWithRelations(cvId);
    if (!cv) {
      throw new CvNotFoundException(cvId);
    }

    cv.ensureOwner(userId);

    const { url } = await this.fileUploadPort.uploadFile(
      file,
      'cvs',
      ALLOWED_CV_FILE_TYPES,
    );
    cv.attachFile(url);

    const updated = await this.cvRepository.update(cv);
    return CvResponseMapper.toDto(updated);
  }
}
