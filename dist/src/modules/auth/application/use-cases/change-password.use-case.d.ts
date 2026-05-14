import { IAuthUserRepositoryPort } from '../ports/auth-user-repository.port';
import { ChangePasswordDto } from '@/modules/auth/presentation/dtos/change-password.dto';
export declare class ChangePasswordUseCase {
    private readonly userRepository;
    constructor(userRepository: IAuthUserRepositoryPort);
    execute(userId: string, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
}
