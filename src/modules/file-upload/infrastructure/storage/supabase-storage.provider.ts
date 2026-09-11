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
const S3_CONNECTION_TIMEOUT_MS = 5_000;
const S3_REQUEST_TIMEOUT_MS = 15_000;
const S3_MAX_ATTEMPTS = 3;

/**
 * Talks to Supabase Storage via its S3-compatible API
 * (https://supabase.com/docs/guides/storage/s3/authentication). Unlike
 * S3StorageProvider this has no S3_ENDPOINT/S3_FORCE_PATH_STYLE knobs: the
 * endpoint is always `https://<project-ref>.storage.supabase.co/storage/v1/s3`
 * and Supabase always requires path-style addressing, so both are fixed
 * here rather than left for env misconfiguration to get wrong.
 */
@Injectable()
export class SupabaseStorageProvider implements IFileStorageProvider {
  private readonly logger = new Logger(SupabaseStorageProvider.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly endpoint: string;
  // Supabase's S3 endpoint always requires SigV4 auth, even for a bucket
  // with public reads enabled — public access is served from a different
  // domain. Only set this if you've enabled that and need upload() (used by
  // the generic /files/upload flow) to return a URL that's actually
  // fetchable without a signature.
  private readonly publicUrlBase?: string;

  constructor(private configService: ConfigService) {
    const projectRef = this.configService.get<string>('SUPABASE_PROJECT_REF')!;
    this.bucketName = this.configService.get<string>(
      'SUPABASE_STORAGE_BUCKET',
    )!;
    this.endpoint = `https://${projectRef}.storage.supabase.co/storage/v1/s3`;
    this.publicUrlBase = this.configService
      .get<string>('SUPABASE_PUBLIC_URL_BASE')
      ?.replace(/\/+$/, '');

    this.s3Client = new S3Client({
      region: this.configService.get<string>('SUPABASE_S3_REGION')!,
      credentials: {
        accessKeyId: this.configService.get<string>('SUPABASE_S3_ACCESS_KEY')!,
        secretAccessKey: this.configService.get<string>(
          'SUPABASE_S3_SECRET_KEY',
        )!,
      },
      endpoint: this.endpoint,
      forcePathStyle: true,
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

      return this.buildPublicUrl(fileKey);
    } catch (error) {
      // The real SDK error (endpoint/host details, credential-validity
      // hints) is logged server-side only — never handed to the client, who
      // gets a fixed generic message instead.
      this.logger.error(
        `Failed to upload to Supabase Storage: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        'Failed to upload file. Please try again later.',
      );
    }
  }

  async delete(fileUrl: string): Promise<void> {
    try {
      const fileKey = this.extractKeyFromUrl(fileUrl);
      if (fileKey) {
        await this.deleteByKey(fileKey);
      }
    } catch (error) {
      this.logger.error(
        `Failed to delete file from Supabase Storage: ${(error as Error).message}`,
      );
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
        `Failed to upload buffer to Supabase Storage (key: ${key}): ${(error as Error).message}`,
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
      this.logger.error(
        `Failed to delete Supabase Storage object ${key}: ${(error as Error).message}`,
      );
    }
  }

  isOwnedUrl(url: string): boolean {
    let host: string;
    try {
      host = new URL(url).hostname.toLowerCase();
    } catch {
      return false;
    }

    if (this.publicUrlBase) {
      try {
        return host === new URL(this.publicUrlBase).hostname.toLowerCase();
      } catch {
        return false;
      }
    }

    // Path-style access: the bucket is a path segment, not part of the
    // host, so any URL on the project's storage host is considered ours.
    return host === new URL(this.endpoint).hostname.toLowerCase();
  }

  // Mirrors the branch order in buildPublicUrl(): whichever URL shape
  // upload() would have produced is the one we must be able to parse back.
  private buildPublicUrl(fileKey: string): string {
    if (this.publicUrlBase) {
      return `${this.publicUrlBase}/${fileKey}`;
    }
    return `${this.endpoint}/${this.bucketName}/${fileKey}`;
  }

  private extractKeyFromUrl(fileUrl: string): string | undefined {
    if (this.publicUrlBase && fileUrl.startsWith(`${this.publicUrlBase}/`)) {
      return fileUrl.slice(this.publicUrlBase.length + 1);
    }
    return fileUrl.split(`${this.bucketName}/`)[1];
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

  async downloadBuffer(key: string): Promise<Buffer> {
    try {
      const response = await this.s3Client.send(
        new GetObjectCommand({ Bucket: this.bucketName, Key: key }),
      );
      const bytes = await response.Body!.transformToByteArray();
      return Buffer.from(bytes);
    } catch (error) {
      this.logger.error(
        `Failed to download Supabase Storage object ${key}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new InternalServerErrorException(
        'Failed to read file. Please try again later.',
      );
    }
  }
}
