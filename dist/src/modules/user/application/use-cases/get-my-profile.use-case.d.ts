import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';
export declare class GetMyProfileUseCase {
    private readonly userRepository;
    constructor(userRepository: IUserRepository);
    execute(userId: string): Promise<any>;
}
