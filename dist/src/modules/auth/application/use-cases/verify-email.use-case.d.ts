import { IAuthUserRepositoryPort } from '../ports/auth-user-repository.port';
import { VerifyEmailDto } from '@/modules/auth/presentation/dtos/verify-email.dto';
export declare class VerifyEmailUseCase {
    private readonly userRepository;
    constructor(userRepository: IAuthUserRepositoryPort);
    execute(dto: VerifyEmailDto): Promise<{
        message: string;
    }>;
}
