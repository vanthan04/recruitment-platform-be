export interface UploadBufferParams {
  key: string;
  buffer: Buffer;
  mimeType: string;
}

export interface SignedUrlOptions {
  expiresInSeconds?: number;
  /** Sets Content-Disposition on the signed response so the browser saves it under this name. */
  downloadFilename?: string;
}

export abstract class IFileStorageProvider {
  /**
   * Upload một file lên bộ lưu trữ (dùng cho các use case public-ish, provider tự sinh key)
   * @param file Đối tượng file từ Multer
   * @param folder Thư mục con muốn lưu (tùy chọn)
   * @returns URL của file sau khi upload thành công
   */
  abstract upload(file: Express.Multer.File, folder?: string): Promise<string>;

  /**
   * Xóa một file khỏi bộ lưu trữ
   * @param fileUrl URL của file cần xóa
   */
  abstract delete(fileUrl: string): Promise<void>;

  /**
   * Upload a buffer to an explicit, caller-generated key. Used for private objects
   * (e.g. CVs) where the key must follow a specific, backend-controlled format.
   */
  abstract uploadBuffer(params: UploadBufferParams): Promise<void>;

  /** Delete an object by its exact key. */
  abstract deleteByKey(key: string): Promise<void>;

  /** Generate a time-limited signed URL to read a private object. */
  abstract getSignedUrl(
    key: string,
    options?: SignedUrlOptions,
  ): Promise<string>;

  /**
   * True if `url` actually points at this app's own storage bucket/endpoint
   * — i.e. it's a value `upload()` itself could have produced, not an
   * arbitrary client-supplied URL. Used wherever a client submits a URL it
   * claims came from a prior upload (chat attachments, for example) to stop
   * that field from becoming a way to attach any external link.
   */
  abstract isOwnedUrl(url: string): boolean;
}
