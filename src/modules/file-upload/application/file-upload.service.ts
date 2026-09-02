import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { UploadFileCommand } from './commands/upload-file.command';

@Injectable()
export class FileUploadService {
  constructor(private readonly commandBus: CommandBus) {}

  async uploadFile(file: Express.Multer.File, folder?: string, allowedMimeTypes?: string[]) {
    return this.commandBus.execute(new UploadFileCommand(file, folder, allowedMimeTypes));
  }
}
