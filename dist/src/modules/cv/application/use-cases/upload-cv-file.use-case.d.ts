import { ICvRepository } from '@/modules/cv/domain/repositories/cv.repository';
import { FileUploadService } from '@/modules/file-upload/application/file-upload.service';
import { CvResponseDto } from '@/modules/cv/application/dto/cv-response.dto';
export declare class UploadCvFileUseCase {
    private readonly cvRepository;
    private readonly fileUploadService;
    constructor(cvRepository: ICvRepository, fileUploadService: FileUploadService);
    execute(userId: string, cvId: string, file: Express.Multer.File): Promise<CvResponseDto>;
}
