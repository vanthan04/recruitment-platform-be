import { CreateCvUseCase } from '@/modules/cv/application/use-cases/create-cv.use-case';
import { UpdateCvUseCase } from '@/modules/cv/application/use-cases/update-cv.use-case';
import { PublishCvUseCase } from '@/modules/cv/application/use-cases/publish-cv.use-case';
import { GetCvUseCase } from '@/modules/cv/application/use-cases/get-cv.use-case';
import { ListMyCvsUseCase } from '@/modules/cv/application/use-cases/list-my-cvs.use-case';
import { DeleteCvUseCase } from '@/modules/cv/application/use-cases/delete-cv.use-case';
import { CreateCvDto } from '@/modules/cv/presentation/dtos/create-cv.dto';
import { UpdateCvDto } from '@/modules/cv/presentation/dtos/update-cv.dto';
export declare class CvController {
    private readonly createCvUseCase;
    private readonly updateCvUseCase;
    private readonly publishCvUseCase;
    private readonly getCvUseCase;
    private readonly listMyCvsUseCase;
    private readonly deleteCvUseCase;
    constructor(createCvUseCase: CreateCvUseCase, updateCvUseCase: UpdateCvUseCase, publishCvUseCase: PublishCvUseCase, getCvUseCase: GetCvUseCase, listMyCvsUseCase: ListMyCvsUseCase, deleteCvUseCase: DeleteCvUseCase);
    create(userId: string, dto: CreateCvDto): Promise<import("../../../../common/dtos/response.dto").ResponseDto<import("../../application/dto/cv-response.dto").CvResponseDto>>;
    listMyCvs(userId: string): Promise<import("../../../../common/dtos/response.dto").ResponseDto<import("../../application/dto/cv-response.dto").CvResponseDto>>;
    getById(id: string): Promise<import("../../../../common/dtos/response.dto").ResponseDto<import("../../application/dto/cv-response.dto").CvResponseDto>>;
    update(userId: string, cvId: string, dto: UpdateCvDto): Promise<import("../../../../common/dtos/response.dto").ResponseDto<import("../../application/dto/cv-response.dto").CvResponseDto>>;
    publish(userId: string, cvId: string): Promise<import("../../../../common/dtos/response.dto").ResponseDto<import("../../application/dto/cv-response.dto").CvResponseDto>>;
    delete(userId: string, cvId: string): Promise<void>;
}
