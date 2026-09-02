import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { IFileStorageProvider } from '@/modules/file-upload/domain/providers/file-storage.provider.interface';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import * as path from 'path';

@Injectable()
export class S3StorageProvider implements IFileStorageProvider {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;

  constructor(private configService: ConfigService) {
    this.region = this.configService.get<string>('S3_REGION')!;
    this.bucketName = this.configService.get<string>('S3_BUCKET')!;

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get<string>('S3_ACCESS_KEY')!,
        secretAccessKey: this.configService.get<string>('S3_SECRET_KEY')!,
      },
      endpoint: this.configService.get<string>('S3_ENDPOINT'),
      forcePathStyle: this.configService.get<boolean>('S3_FORCE_PATH_STYLE', false),
    });
  }

  async upload(file: Express.Multer.File, folder: string = 'general'): Promise<string> {
    try {
      const fileExtension = path.extname(file.originalname);
      const fileName = `${randomUUID()}${fileExtension}`;
      const fileKey = `${folder}/${fileName}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await this.s3Client.send(command);

      const endpoint = this.configService.get<string>('S3_ENDPOINT');
      if (endpoint) {
          return `${endpoint}/${this.bucketName}/${fileKey}`;
      }

      return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${fileKey}`;
    } catch (error) {
      throw new InternalServerErrorException('Lỗi khi upload lên S3: ' + error.message);
    }
  }

  async delete(fileUrl: string): Promise<void> {
    try {
      const fileKey = fileUrl.split(`${this.bucketName}/`)[1] || fileUrl.split('.com/')[1];
      if (fileKey) {
        const command = new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: fileKey,
        });
        await this.s3Client.send(command);
      }
    } catch (error) {
      console.error('Không thể xóa file trên S3:', error.message);
    }
  }
}
