import { User } from './user.entity';
export declare abstract class IUserRepository {
    abstract findByEmail(email: string): Promise<User | null>;
    abstract findById(id: string): Promise<User | null>;
    abstract existsByEmail(email: string): Promise<boolean>;
    abstract save(user: Partial<User>): Promise<User>;
    abstract updateRefreshToken(id: string, refreshToken: string | null): Promise<void>;
}
