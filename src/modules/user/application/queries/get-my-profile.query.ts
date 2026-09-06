import { Injectable } from '@nestjs/common';
import { Query, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';
import { UserNotFoundException } from '@/modules/user/domain/exceptions/user.exceptions';
import { UserResponseMapper } from '@/modules/user/application/mappers/user-response.mapper';
import { UserResponseDto } from '@/modules/user/application/dto/user-response.dto';

export class GetMyProfileQuery extends Query<UserResponseDto> {
  constructor(public readonly userId: string) {
    super();
  }
}

@Injectable()
@QueryHandler(GetMyProfileQuery)
export class GetMyProfileHandler implements IQueryHandler<GetMyProfileQuery> {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute({ userId }: GetMyProfileQuery): Promise<UserResponseDto> {
    const user = await this.userRepository.findByIdWithProfile(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }

    return UserResponseMapper.toDto(user);
  }
}
