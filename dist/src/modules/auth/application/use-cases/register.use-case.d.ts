import { RegisterRequestDto } from '@/modules/auth/presentation/dtos/register-request.dto';
import { IAuthUserRepositoryPort } from '../ports/auth-user-repository.port';
import { IAuthMailServicePort } from '../ports/auth-mail-service.port';
export declare class RegisterUseCase {
    private readonly userRepository;
    private readonly mailService;
    constructor(userRepository: IAuthUserRepositoryPort, mailService: IAuthMailServicePort);
    execute(dto: RegisterRequestDto): Promise<{
        email: string;
    }>;
}
