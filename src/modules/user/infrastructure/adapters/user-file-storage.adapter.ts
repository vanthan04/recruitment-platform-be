import { Injectable } from '@nestjs/common';
import { IUserFileStoragePort } from '@/modules/user/application/ports/user-file-storage.port';
import { FileUploadService } from '@/modules/file-upload/application/file-upload.service';

@Injectable()
export class UserFileStorageAdapter implements IUserFileStoragePort {
  constructor(private readonly fileUploadService: FileUploadService) {}

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    const result = await this.fileUploadService.uploadFile(file, folder);
    return result.url;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    // Currently FileUploadService might not have delete logic, 
    // but the Port defines it for future use.
    // For now we just implement as a placeholder or call service if it exists.
    console.log(`Deleting file: ${fileUrl}`);
  }
}
