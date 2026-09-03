import {
  UploadFileCommand,
  UploadFileHandler,
} from '@/modules/file-upload/application/commands/upload-file.command';
import { IFileStorageProvider } from '@/modules/file-upload/domain/providers/file-storage.provider.interface';
import {
  FileMissingException,
  InvalidFileTypeException,
} from '@/modules/file-upload/domain/exceptions/file-upload.exceptions';

function makeFile(
  overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname: 'avatar.png',
    encoding: '7bit',
    mimetype: 'image/png',
    size: 1024,
    buffer: Buffer.from('fake'),
    ...overrides,
  } as Express.Multer.File;
}

describe('UploadFileHandler', () => {
  let handler: UploadFileHandler;
  let storageProvider: jest.Mocked<IFileStorageProvider>;

  beforeEach(() => {
    storageProvider = { upload: jest.fn(), delete: jest.fn() };
    handler = new UploadFileHandler(storageProvider);
  });

  it('throws FileMissingException when no file is provided', async () => {
    await expect(
      handler.execute(new UploadFileCommand(undefined as any)),
    ).rejects.toThrow(FileMissingException);
    expect(storageProvider.upload).not.toHaveBeenCalled();
  });

  it('throws InvalidFileTypeException when the mimetype is not in the default allow-list', async () => {
    await expect(
      handler.execute(
        new UploadFileCommand(
          makeFile({ mimetype: 'application/x-msdownload' }),
        ),
      ),
    ).rejects.toThrow(InvalidFileTypeException);
    expect(storageProvider.upload).not.toHaveBeenCalled();
  });

  it('uploads the file and returns its URL when the mimetype is allowed', async () => {
    storageProvider.upload.mockResolvedValue(
      'https://cdn.example.com/avatar.png',
    );

    const result = await handler.execute(
      new UploadFileCommand(makeFile(), 'avatars'),
    );

    expect(result).toEqual({ url: 'https://cdn.example.com/avatar.png' });
    expect(storageProvider.upload).toHaveBeenCalledWith(
      expect.objectContaining({ mimetype: 'image/png' }),
      'avatars',
    );
  });

  it('respects a custom allowed-mimetypes list', async () => {
    storageProvider.upload.mockResolvedValue('https://cdn.example.com/cv.pdf');

    const result = await handler.execute(
      new UploadFileCommand(
        makeFile({ originalname: 'cv.pdf', mimetype: 'application/pdf' }),
        'cvs',
        ['application/pdf'],
      ),
    );

    expect(result).toEqual({ url: 'https://cdn.example.com/cv.pdf' });
  });

  it('rejects a file outside a custom allowed-mimetypes list even if it is a valid image', async () => {
    await expect(
      handler.execute(
        new UploadFileCommand(makeFile({ mimetype: 'image/png' }), 'cvs', [
          'application/pdf',
        ]),
      ),
    ).rejects.toThrow(InvalidFileTypeException);
  });
});
