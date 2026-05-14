import { GetMyProfileUseCase } from '@/modules/user/application/use-cases/get-my-profile.use-case';
import { UpdateProfileUseCase } from '@/modules/user/application/use-cases/update-profile.use-case';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
export declare class UserController {
    private readonly getMyProfileUseCase;
    private readonly updateProfileUseCase;
    constructor(getMyProfileUseCase: GetMyProfileUseCase, updateProfileUseCase: UpdateProfileUseCase);
    getMe(userId: string): Promise<import("../../../../common/dtos/response.dto").ResponseDto<any>>;
    updateProfile(userId: string, dto: UpdateProfileDto): Promise<import("../../../../common/dtos/response.dto").ResponseDto<{
        message: string;
    }>>;
}
