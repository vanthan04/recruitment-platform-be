import { Injectable } from '@nestjs/common';
import { UploadFileUseCase } from './use-cases/upload-file.use-case';

@Injectable()
export class FileUploadService {
  constructor(private readonly uploadFileUseCase: UploadFileUseCase) {}

  async uploadFile(file: Express.Multer.File, folder?: string, allowedMimeTypes?: string[]) {
    return this.uploadFileUseCase.execute(file, folder, allowedMimeTypes);
  }
}
