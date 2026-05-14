import { IAuthUserRepositoryPort } from '../ports/auth-user-repository.port';
import { ForgotPasswordDto } from '@/modules/auth/presentation/dtos/forgot-password.dto';
import { IAuthMailServicePort } from '../ports/auth-mail-service.port';
export declare class ForgotPasswordUseCase {
    private readonly userRepository;
    private readonly mailService;
    constructor(userRepository: IAuthUserRepositoryPort, mailService: IAuthMailServicePort);
    execute(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
}
