import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import {
  IFileStorageProvider,
  SignedUrlOptions,
  UploadBufferParams,
} from '@/modules/file-upload/domain/providers/file-storage.provider.interface';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl as getS3SignedUrl } from '@aws-sdk/s3-request-presigner';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { randomUUID } from 'crypto';
import * as path from 'path';

const DEFAULT_SIGNED_URL_EXPIRY_SECONDS = 300;
// Without these, a network partition or a hung S3-compatible endpoint falls
// back to Node's own (much longer) socket defaults — every caller here
// awaits this inline in a request handler, so that hang becomes the
// request's hang too.
const S3_CONNECTION_TIMEOUT_MS = 5_000;
const S3_REQUEST_TIMEOUT_MS = 15_000;
const S3_MAX_ATTEMPTS = 3;

@Injectable()
export class S3StorageProvider implements IFileStorageProvider {
  private readonly logger = new Logger(S3StorageProvider.name);
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
      forcePathStyle: this.configService.get<boolean>(
        'S3_FORCE_PATH_STYLE',
        false,
      ),
      requestHandler: new NodeHttpHandler({
        connectionTimeout: S3_CONNECTION_TIMEOUT_MS,
        requestTimeout: S3_REQUEST_TIMEOUT_MS,
      }),
      maxAttempts: S3_MAX_ATTEMPTS,
    });
  }

  async upload(
    file: Express.Multer.File,
    folder: string = 'general',
  ): Promise<string> {
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
      // The real AWS SDK message (endpoint/host details, credential-validity
      // hints) is logged server-side only — never handed to the client, who
      // gets a fixed generic message instead.
      this.logger.error(
        `Failed to upload to S3: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        'Failed to upload file. Please try again later.',
      );
    }
  }

  async delete(fileUrl: string): Promise<void> {
    try {
      const fileKey =
        fileUrl.split(`${this.bucketName}/`)[1] || fileUrl.split('.com/')[1];
      if (fileKey) {
        await this.deleteByKey(fileKey);
      }
    } catch (error) {
      this.logger.error(`Failed to delete file from S3: ${error.message}`);
    }
  }

  async uploadBuffer({
    key,
    buffer,
    mimeType,
  }: UploadBufferParams): Promise<void> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      });
      await this.s3Client.send(command);
    } catch (error) {
      this.logger.error(
        `Failed to upload buffer to S3 (key: ${key}): ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        'Failed to upload file. Please try again later.',
      );
    }
  }

  async deleteByKey(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await this.s3Client.send(command);
    } catch (error) {
      this.logger.error(`Failed to delete S3 object ${key}: ${error.message}`);
    }
  }

  isOwnedUrl(url: string): boolean {
    let host: string;
    try {
      host = new URL(url).hostname.toLowerCase();
    } catch {
      return false;
    }

    const endpoint = this.configService.get<string>('S3_ENDPOINT');
    if (endpoint) {
      try {
        // Path-style access (LocalStack/MinIO): the bucket is a path
        // segment, not part of the host, so any URL on the configured
        // endpoint host is considered ours.
        return host === new URL(endpoint).hostname.toLowerCase();
      } catch {
        return false;
      }
    }

    // Virtual-hosted-style AWS S3: `<bucket>.s3.<region>.amazonaws.com`.
    return host === `${this.bucketName}.s3.${this.region}.amazonaws.com`.toLowerCase();
  }

  async getSignedUrl(key: string, options?: SignedUrlOptions): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ResponseContentDisposition: options?.downloadFilename
        ? `attachment; filename="${options.downloadFilename.replace(/"/g, '')}"`
        : undefined,
    });

    return getS3SignedUrl(this.s3Client, command, {
      expiresIn: options?.expiresInSeconds ?? DEFAULT_SIGNED_URL_EXPIRY_SECONDS,
    });
  }
}
