import { Injectable, BadRequestException } from '@nestjs/common';
import { IFileStorageProvider } from '@/modules/file-upload/domain/providers/file-storage.provider.interface';

@Injectable()
export class UploadFileUseCase {
  constructor(private readonly storageProvider: IFileStorageProvider) {}

  async execute(file: Express.Multer.File, folder?: string): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException('FILE_NOT_FOUND');
    }

    // Bạn có thể thêm logic validate loại file hoặc dung lượng ở đây
    // Ví dụ: chỉ cho phép ảnh
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('INVALID_FILE_TYPE');
    }

    const url = await this.storageProvider.upload(file, folder);

    return { url };
  }
}
