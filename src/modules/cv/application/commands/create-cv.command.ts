import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import { ICvRepository } from '@/modules/cv/domain/repositories/cv.repository';
import { ICvStoragePort } from '@/modules/cv/application/ports/cv-storage.port';
import { Cv } from '@/modules/cv/domain/entities/cv.entity';
import { CvDomainService } from '@/modules/cv/domain/domain-services/cv-domain.service';
import { CV_FILE_EXTENSIONS } from '@/modules/cv/domain/value-objects/cv-file-type.vo';
import { CvResponseMapper } from '@/modules/cv/application/mappers/cv-response.mapper';
import { CvResponseDto } from '@/modules/cv/application/dto/cv-response.dto';

/**
 * S3 key format: cvs/{userId}/{year}/{month}/{cvId}.{extension}.
 * Backend-generated — never derived from the client-supplied original
 * filename (which is stored only as display metadata, `originalName`).
 */
function buildCvFileKey(
  userId: string,
  cvId: string,
  extension: string,
): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `cvs/${userId}/${year}/${month}/${cvId}.${extension}`;
}

export class CreateCvCommand {
  constructor(
    public readonly userId: string,
    public readonly title: string,
    public readonly file: Express.Multer.File,
  ) {}
}

@Injectable()
@CommandHandler(CreateCvCommand)
export class CreateCvHandler implements ICommandHandler<
  CreateCvCommand,
  CvResponseDto
> {
  constructor(
    private readonly cvRepository: ICvRepository,
    @Inject(ICvStoragePort)
    private readonly cvStorage: ICvStoragePort,
    private readonly configService: ConfigService,
  ) {}

  async execute({
    userId,
    title,
    file,
  }: CreateCvCommand): Promise<CvResponseDto> {
    const maxFileSize = this.configService.get<number>(
      'CV_MAX_FILE_SIZE',
      10 * 1024 * 1024,
    );
    const fileType = CvDomainService.validateUploadedFile(file, maxFileSize);

    const cv = new Cv({
      title,
      originalName: file.originalname,
      fileType,
      mimeType: file.mimetype,
      fileSize: file.size,
      fileKey: '',
      userId,
    });

    const fileKey = buildCvFileKey(userId, cv.id, CV_FILE_EXTENSIONS[fileType]);
    cv.fileKey = fileKey;

    await this.cvStorage.upload({
      key: fileKey,
      buffer: file.buffer,
      mimeType: file.mimetype,
    });

    try {
      const saved = await this.cvRepository.save(cv);
      return CvResponseMapper.toDto(saved);
    } catch (error) {
      // S3 and PostgreSQL are not one distributed transaction — if the DB
      // insert fails after a successful upload, best-effort clean up the
      // now-orphaned S3 object rather than leaving it unreferenced forever.
      await this.cvStorage.delete(fileKey).catch(() => undefined);
      throw error;
    }
  }
}
