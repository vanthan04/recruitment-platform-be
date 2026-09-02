import { IAuthUserRepositoryPort, CreateUserOptions } from '../../application/ports/auth-user-repository.port';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';
import { User } from '@/modules/user/domain/entities/user.entity';
export declare class AuthUserAdapter implements IAuthUserRepositoryPort {
    private readonly userRepository;
    constructor(userRepository: IUserRepository);
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    existsByEmail(email: string): Promise<boolean>;
    save(data: CreateUserOptions): Promise<User>;
    findByVerifyCode(code: string): Promise<User | null>;
}
