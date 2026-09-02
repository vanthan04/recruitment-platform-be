import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';
import { normalizePagination } from '@/common/utils/pagination.util';

export class AdminListUsersQuery {
  constructor(
    public readonly page: number = 1,
    public readonly limit: number = 10,
  ) {}
}

export interface AdminListUsersResult {
  users: Record<string, any>[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
@QueryHandler(AdminListUsersQuery)
export class AdminListUsersHandler implements IQueryHandler<
  AdminListUsersQuery,
  AdminListUsersResult
> {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute({
    page,
    limit,
  }: AdminListUsersQuery): Promise<AdminListUsersResult> {
    const normalized = normalizePagination({ page, limit });

    const { users, total } = await this.userRepository.findAllPaginated(
      normalized.page,
      normalized.limit,
    );

    const data = users.map((user) => {
      const { password, verifyCode, ...safeUser } = user as any;
      return safeUser;
    });

    return {
      users: data,
      total,
      page: normalized.page,
      limit: normalized.limit,
    };
  }
}
