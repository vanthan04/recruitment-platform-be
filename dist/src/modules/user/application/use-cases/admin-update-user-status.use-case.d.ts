import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';
import { UserStatus } from '@/common/enums/user-status.enum';
import { UserRole } from '@/common/enums/user-role.enum';
export interface AdminUpdateUserInput {
    status?: UserStatus;
    role?: UserRole;
}
export declare class AdminUpdateUserStatusUseCase {
    private readonly userRepository;
    constructor(userRepository: IUserRepository);
    execute(userId: string, input: AdminUpdateUserInput): Promise<{
        message: string;
    }>;
}
