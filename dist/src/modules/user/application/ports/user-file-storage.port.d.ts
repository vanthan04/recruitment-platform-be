export declare abstract class IUserFileStoragePort {
    abstract deleteFile(fileUrl: string): Promise<void>;
    abstract uploadFile(file: Express.Multer.File, folder: string): Promise<string>;
}
