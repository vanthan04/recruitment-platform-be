import { AdminListUsersUseCase } from '@/modules/user/application/use-cases/admin-list-users.use-case';
import { AdminUpdateUserStatusUseCase } from '@/modules/user/application/use-cases/admin-update-user-status.use-case';
import { AdminUpdateUserStatusDto } from '../dtos/admin-update-user-status.dto';
export declare class UserAdminController {
    private readonly adminListUsersUseCase;
    private readonly adminUpdateUserStatusUseCase;
    constructor(adminListUsersUseCase: AdminListUsersUseCase, adminUpdateUserStatusUseCase: AdminUpdateUserStatusUseCase);
    listUsers(page?: number, limit?: number): Promise<import("../../../../common/dtos/response.dto").ResponseDto<any>>;
    updateStatus(userId: string, dto: AdminUpdateUserStatusDto): Promise<{
        message: string;
    }>;
}
