import { ICvRepository } from '@/modules/cv/domain/repositories/cv.repository';
export declare class ExportCvPdfUseCase {
    private readonly cvRepository;
    constructor(cvRepository: ICvRepository);
    execute(cvId: string): Promise<{
        buffer: Buffer;
        fileName: string;
    }>;
    private renderPdf;
}
