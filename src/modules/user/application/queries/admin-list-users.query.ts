import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';
import { normalizePagination, getPaginationInfo } from '@/common/utils/pagination.util';
import { ApiResponse } from '@/common/dtos/api-response';

export class AdminListUsersQuery {
  constructor(
    public readonly page: number = 1,
    public readonly limit: number = 10,
  ) {}
}

@Injectable()
@QueryHandler(AdminListUsersQuery)
export class AdminListUsersHandler implements IQueryHandler<AdminListUsersQuery> {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute({ page, limit }: AdminListUsersQuery) {
    const normalized = normalizePagination({ page, limit });

    const { users, total } = await this.userRepository.findAllPaginated(
      normalized.page,
      normalized.limit,
    );

    const data = users.map((user) => {
      const { password, ...safeUser } = user as any;
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
