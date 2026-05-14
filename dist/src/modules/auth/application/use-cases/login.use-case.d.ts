import { IAuthUserRepositoryPort } from '../ports/auth-user-repository.port';
import { LoginRequestDto } from '@/modules/auth/presentation/dtos/login-request.dto';
export declare class LoginUseCase {
    private readonly userRepository;
    constructor(userRepository: IAuthUserRepositoryPort);
    execute(dto: LoginRequestDto): Promise<import("../../../user/domain/entities/user.entity").User>;
}
