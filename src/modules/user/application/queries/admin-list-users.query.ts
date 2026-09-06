import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler, Query } from '@nestjs/cqrs';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';
import { normalizePagination } from '@/common/utils/pagination.util';
import { UserResponseDto } from '@/modules/user/application/dto/user-response.dto';
import { UserResponseMapper } from '@/modules/user/application/mappers/user-response.mapper';

export class AdminListUsersQuery extends Query<AdminListUsersResult> {
  constructor(
    public readonly page: number = 1,
    public readonly limit: number = 10,
  ) {
    super();
  }
}

export interface AdminListUsersResult {
  users: UserResponseDto[];
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

    return {
      users: UserResponseMapper.toDtoList(users),
      total,
      page: normalized.page,
      limit: normalized.limit,
    };
  }
}
