export interface UploadedFileResult {
  url: string;
}

export abstract class IFileUploadPort {
  abstract uploadFile(
    file: Express.Multer.File,
    folder?: string,
    allowedMimeTypes?: string[],
  ): Promise<UploadedFileResult>;
}
