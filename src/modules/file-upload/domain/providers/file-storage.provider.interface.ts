export abstract class IFileStorageProvider {
  /**
   * Upload một file lên bộ lưu trữ
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
}
