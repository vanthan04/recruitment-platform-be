import { CommandBus } from '@nestjs/cqrs';
import { FileUploadService } from '@/modules/file-upload/application/file-upload.service';
import { UploadFileCommand } from '@/modules/file-upload/application/commands/upload-file.command';

describe('FileUploadService', () => {
  let service: FileUploadService;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as any;
    service = new FileUploadService(commandBus);
  });

  it('dispatches an UploadFileCommand with the given file, folder, and allow-list', async () => {
    commandBus.execute.mockResolvedValue({ url: 'https://cdn.example.com/x' });
    const file = { mimetype: 'image/png' } as Express.Multer.File;

    const result = await service.uploadFile(file, 'avatars', ['image/png']);

    expect(result).toEqual({ url: 'https://cdn.example.com/x' });
    const dispatched = commandBus.execute.mock.calls[0][0];
    expect(dispatched).toBeInstanceOf(UploadFileCommand);
    expect(dispatched).toMatchObject({
      file,
      folder: 'avatars',
      allowedMimeTypes: ['image/png'],
    });
  });
});
