import { FileUploadService } from '../../application/file-upload.service';
export declare class FileUploadController {
    private readonly fileUploadService;
    constructor(fileUploadService: FileUploadService);
    uploadFile(file: Express.Multer.File, folder?: string): Promise<import("../../../../common/dtos/response.dto").ResponseDto<{
        url: string;
    }>>;
}
