import { Injectable } from '@nestjs/common';
import { IFileUploadPort, UploadedFileResult } from '@/modules/cv/application/ports/file-upload.port';
import { FileUploadService } from '@/modules/file-upload/application/file-upload.service';

@Injectable()
export class CvFileUploadAdapter implements IFileUploadPort {
  constructor(private readonly fileUploadService: FileUploadService) {}

  async uploadFile(
    file: Express.Multer.File,
    folder?: string,
    allowedMimeTypes?: string[],
  ): Promise<UploadedFileResult> {
    return this.fileUploadService.uploadFile(file, folder, allowedMimeTypes);
  }
}
