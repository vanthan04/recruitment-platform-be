export declare abstract class IFileStorageProvider {
    abstract upload(file: Express.Multer.File, folder?: string): Promise<string>;
    abstract delete(fileUrl: string): Promise<void>;
}
