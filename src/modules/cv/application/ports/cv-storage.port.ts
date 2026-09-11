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
  /**
   * Raw file bytes for server-side processing only (currently: AI CV text
   * extraction — see src/ai). Never used to serve a file back to a client.
   */
  abstract downloadBuffer(key: string): Promise<Buffer>;
}
