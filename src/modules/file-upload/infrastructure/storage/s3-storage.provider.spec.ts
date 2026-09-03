import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { S3StorageProvider } from '@/modules/file-upload/infrastructure/storage/s3-storage.provider';

jest.mock('@aws-sdk/client-s3');

function makeConfigService(
  overrides: Record<string, unknown> = {},
): ConfigService {
  const config: Record<string, unknown> = {
    S3_REGION: 'ap-southeast-1',
    S3_BUCKET: 'my-bucket',
    S3_ACCESS_KEY: 'access-key',
    S3_SECRET_KEY: 'secret-key',
    ...overrides,
  };
  return {
    get: jest.fn((key: string, defaultValue?: unknown) =>
      key in config ? config[key] : defaultValue,
    ),
  } as unknown as ConfigService;
}

function makeFile(
  overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File {
  return {
    originalname: 'avatar.png',
    mimetype: 'image/png',
    buffer: Buffer.from('fake'),
    ...overrides,
  } as Express.Multer.File;
}

describe('S3StorageProvider', () => {
  let send: jest.Mock;

  beforeEach(() => {
    send = jest.fn().mockResolvedValue({});
    (S3Client as jest.Mock).mockImplementation(() => ({ send }));
  });

  describe('upload', () => {
    it('uploads with a folder-prefixed key and returns the default AWS S3 URL', async () => {
      const provider = new S3StorageProvider(makeConfigService());

      const url = await provider.upload(makeFile(), 'avatars');

      expect(send).toHaveBeenCalledTimes(1);
      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: 'my-bucket',
          ContentType: 'image/png',
          Key: expect.stringMatching(/^avatars\/[0-9a-f-]+\.png$/),
        }),
      );
      expect(url).toMatch(
        /^https:\/\/my-bucket\.s3\.ap-southeast-1\.amazonaws\.com\/avatars\/[0-9a-f-]+\.png$/,
      );
    });

    it('defaults to the "general" folder when none is given', async () => {
      const provider = new S3StorageProvider(makeConfigService());

      await provider.upload(makeFile());

      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Key: expect.stringMatching(/^general\// as any),
        }),
      );
    });

    it('returns a custom-endpoint URL when S3_ENDPOINT is configured', async () => {
      const provider = new S3StorageProvider(
        makeConfigService({ S3_ENDPOINT: 'https://minio.internal' }),
      );

      const url = await provider.upload(makeFile(), 'avatars');

      expect(url).toMatch(
        /^https:\/\/minio\.internal\/my-bucket\/avatars\/[0-9a-f-]+\.png$/,
      );
    });

    it('wraps an S3 failure in InternalServerErrorException', async () => {
      send.mockRejectedValue(new Error('network down'));
      const provider = new S3StorageProvider(makeConfigService());

      await expect(provider.upload(makeFile())).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('delete', () => {
    it('extracts the key from a path-style URL via the "bucket/" split (primary branch)', async () => {
      const provider = new S3StorageProvider(
        makeConfigService({ S3_ENDPOINT: 'https://minio.internal' }),
      );

      await provider.delete('https://minio.internal/my-bucket/avatars/abc.png');

      expect(DeleteObjectCommand).toHaveBeenCalledWith({
        Bucket: 'my-bucket',
        Key: 'avatars/abc.png',
      });
      expect(send).toHaveBeenCalledTimes(1);
    });

    it('extracts the key from the default AWS virtual-hosted URL via the ".com/" fallback', async () => {
      // "my-bucket.s3.<region>.amazonaws.com" never contains the literal
      // "my-bucket/" substring the primary branch looks for, so this URL
      // shape only works because of the ".com/" fallback.
      const provider = new S3StorageProvider(makeConfigService());

      await provider.delete(
        'https://my-bucket.s3.ap-southeast-1.amazonaws.com/avatars/abc.png',
      );

      expect(DeleteObjectCommand).toHaveBeenCalledWith({
        Bucket: 'my-bucket',
        Key: 'avatars/abc.png',
      });
    });

    it('swallows a delete failure instead of throwing (best-effort cleanup)', async () => {
      send.mockRejectedValue(new Error('not found'));
      const provider = new S3StorageProvider(makeConfigService());

      await expect(
        provider.delete(
          'https://my-bucket.s3.ap-southeast-1.amazonaws.com/avatars/abc.png',
        ),
      ).resolves.toBeUndefined();
    });
  });
});
