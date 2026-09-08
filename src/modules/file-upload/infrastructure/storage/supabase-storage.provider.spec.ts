import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { SupabaseStorageProvider } from '@/modules/file-upload/infrastructure/storage/supabase-storage.provider';

jest.mock('@aws-sdk/client-s3');

function makeConfigService(
  overrides: Record<string, unknown> = {},
): ConfigService {
  const config: Record<string, unknown> = {
    SUPABASE_PROJECT_REF: 'abcdefghijklmnop',
    SUPABASE_S3_REGION: 'ap-southeast-1',
    SUPABASE_STORAGE_BUCKET: 'my-bucket',
    SUPABASE_S3_ACCESS_KEY: 'access-key',
    SUPABASE_S3_SECRET_KEY: 'secret-key',
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

describe('SupabaseStorageProvider', () => {
  let send: jest.Mock;

  beforeEach(() => {
    send = jest.fn().mockResolvedValue({});
    (S3Client as jest.Mock).mockImplementation(() => ({ send }));
  });

  it('configures the client against the project-ref storage endpoint with forced path style', () => {
    // eslint-disable-next-line no-new
    new SupabaseStorageProvider(makeConfigService());

    expect(S3Client).toHaveBeenCalledWith(
      expect.objectContaining({
        region: 'ap-southeast-1',
        endpoint: 'https://abcdefghijklmnop.storage.supabase.co/storage/v1/s3',
        forcePathStyle: true,
        credentials: {
          accessKeyId: 'access-key',
          secretAccessKey: 'secret-key',
        },
      }),
    );
  });

  describe('upload', () => {
    it('uploads with a folder-prefixed key and returns the project storage URL', async () => {
      const provider = new SupabaseStorageProvider(makeConfigService());

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
        /^https:\/\/abcdefghijklmnop\.storage\.supabase\.co\/storage\/v1\/s3\/my-bucket\/avatars\/[0-9a-f-]+\.png$/,
      );
    });

    it('returns a public-base URL when SUPABASE_PUBLIC_URL_BASE is configured', async () => {
      const provider = new SupabaseStorageProvider(
        makeConfigService({
          SUPABASE_PUBLIC_URL_BASE: 'https://cdn.example.com/',
        }),
      );

      const url = await provider.upload(makeFile(), 'avatars');

      expect(url).toMatch(
        /^https:\/\/cdn\.example\.com\/avatars\/[0-9a-f-]+\.png$/,
      );
    });

    it('wraps a failure in InternalServerErrorException', async () => {
      send.mockRejectedValue(new Error('network down'));
      const provider = new SupabaseStorageProvider(makeConfigService());

      await expect(provider.upload(makeFile())).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('delete', () => {
    it('extracts the key from the project storage URL', async () => {
      const provider = new SupabaseStorageProvider(makeConfigService());

      await provider.delete(
        'https://abcdefghijklmnop.storage.supabase.co/storage/v1/s3/my-bucket/avatars/abc.png',
      );

      expect(DeleteObjectCommand).toHaveBeenCalledWith({
        Bucket: 'my-bucket',
        Key: 'avatars/abc.png',
      });
      expect(send).toHaveBeenCalledTimes(1);
    });

    it('extracts the key from a public-base URL when configured', async () => {
      const provider = new SupabaseStorageProvider(
        makeConfigService({
          SUPABASE_PUBLIC_URL_BASE: 'https://cdn.example.com',
        }),
      );

      await provider.delete('https://cdn.example.com/avatars/abc.png');

      expect(DeleteObjectCommand).toHaveBeenCalledWith({
        Bucket: 'my-bucket',
        Key: 'avatars/abc.png',
      });
    });

    it('swallows a delete failure instead of throwing (best-effort cleanup)', async () => {
      send.mockRejectedValue(new Error('not found'));
      const provider = new SupabaseStorageProvider(makeConfigService());

      await expect(
        provider.delete(
          'https://abcdefghijklmnop.storage.supabase.co/storage/v1/s3/my-bucket/avatars/abc.png',
        ),
      ).resolves.toBeUndefined();
    });
  });

  describe('isOwnedUrl', () => {
    it('accepts a URL on the project storage host', () => {
      const provider = new SupabaseStorageProvider(makeConfigService());

      expect(
        provider.isOwnedUrl(
          'https://abcdefghijklmnop.storage.supabase.co/storage/v1/s3/my-bucket/chat/x.pdf',
        ),
      ).toBe(true);
    });

    it('rejects a different project host', () => {
      const provider = new SupabaseStorageProvider(makeConfigService());

      expect(
        provider.isOwnedUrl(
          'https://attacker-project.storage.supabase.co/storage/v1/s3/my-bucket/x.pdf',
        ),
      ).toBe(false);
    });

    it('rejects an arbitrary external URL', () => {
      const provider = new SupabaseStorageProvider(makeConfigService());

      expect(provider.isOwnedUrl('https://attacker.example/track.png')).toBe(
        false,
      );
    });

    it('accepts only the public-base host when SUPABASE_PUBLIC_URL_BASE is configured', () => {
      const provider = new SupabaseStorageProvider(
        makeConfigService({
          SUPABASE_PUBLIC_URL_BASE: 'https://cdn.example.com',
        }),
      );

      expect(provider.isOwnedUrl('https://cdn.example.com/chat/x.pdf')).toBe(
        true,
      );
      expect(
        provider.isOwnedUrl(
          'https://abcdefghijklmnop.storage.supabase.co/storage/v1/s3/my-bucket/chat/x.pdf',
        ),
      ).toBe(false);
    });

    it('rejects a malformed URL instead of throwing', () => {
      const provider = new SupabaseStorageProvider(makeConfigService());

      expect(provider.isOwnedUrl('not-a-url')).toBe(false);
    });
  });
});
