import { IUserRepository } from '../domain/user.repository';
import { User } from '../domain/user.entity';
export declare class UserService {
    private readonly userRepository;
    constructor(userRepository: IUserRepository);
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    isExistedUser(email: string): Promise<boolean>;
    createNewUser(email: string, hashPassword: string, fullName: string, verifyCode: string): Promise<User>;
    updateRefreshToken(userId: string, refreshToken: string | null): Promise<void>;
}
