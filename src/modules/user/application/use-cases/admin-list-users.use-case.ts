import { Injectable } from '@nestjs/common';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';
import { normalizePagination, getPaginationInfo } from '@/common/utils/pagination.util';
import { ApiResponse } from '@/common/dtos/api-response';

@Injectable()
export class AdminListUsersUseCase {
  constructor(private readonly userRepository: IUserRepository) { }

  async execute(page: number = 1, limit: number = 10) {
    const normalized = normalizePagination({ page, limit });
    
    const { users, total } = await this.userRepository.findAllPaginated(
      normalized.page, 
      normalized.limit
    );

    const data = users.map(user => {
      const { password, refreshToken, ...safeUser } = user as any;
      return safeUser;
    });

    const paginationInfo = getPaginationInfo({
      page: normalized.page,
      limit: normalized.limit,
      total,
    });

    return ApiResponse.ok(data, 'Lấy danh sách người dùng thành công', paginationInfo);
  }
}
