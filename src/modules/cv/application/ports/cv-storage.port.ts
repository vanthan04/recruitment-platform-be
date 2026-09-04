export interface CvUploadParams {
  key: string;
  buffer: Buffer;
  mimeType: string;
}

export abstract class ICvStoragePort {
  abstract upload(params: CvUploadParams): Promise<void>;
  abstract delete(key: string): Promise<void>;
  abstract getDownloadUrl(
    key: string,
    downloadFilename: string,
  ): Promise<string>;
}
