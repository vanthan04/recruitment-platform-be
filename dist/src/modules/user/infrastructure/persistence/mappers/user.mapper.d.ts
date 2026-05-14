import { User } from '@/modules/user/domain/entities/user.entity';
export declare class UserMapper {
    static toDomain(raw: any): User | null;
}
