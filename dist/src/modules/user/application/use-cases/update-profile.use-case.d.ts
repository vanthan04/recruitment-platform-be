import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';
import { Gender } from '@/common/enums/gender.enum';
export interface UpdateProfileInput {
    fullName?: string;
    phoneNumber?: string;
    gender?: Gender;
    birthDate?: Date;
    avatarUrl?: string;
}
export declare class UpdateProfileUseCase {
    private readonly userRepository;
    constructor(userRepository: IUserRepository);
    execute(userId: string, input: UpdateProfileInput): Promise<{
        message: string;
    }>;
}
