import { IAuthUserRepositoryPort } from '../ports/auth-user-repository.port';
import { ResetPasswordDto } from '@/modules/auth/presentation/dtos/reset-password.dto';
export declare class ResetPasswordUseCase {
    private readonly userRepository;
    constructor(userRepository: IAuthUserRepositoryPort);
    execute(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
}
