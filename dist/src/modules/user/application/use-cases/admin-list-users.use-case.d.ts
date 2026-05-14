import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';
export declare class AdminListUsersUseCase {
    private readonly userRepository;
    constructor(userRepository: IUserRepository);
    execute(page?: number, limit?: number): Promise<import("../../../../common/dtos/response.dto").ResponseDto<any>>;
}
