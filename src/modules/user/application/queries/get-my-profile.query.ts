import { Injectable, NotFoundException } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';

export class GetMyProfileQuery {
  constructor(public readonly userId: string) {}
}

@Injectable()
@QueryHandler(GetMyProfileQuery)
export class GetMyProfileHandler implements IQueryHandler<GetMyProfileQuery> {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute({ userId }: GetMyProfileQuery) {
    const user = await this.userRepository.findByIdWithProfile(userId);
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    // Usually you don't return the password or other sensitive data
    const { password, verifyCode, ...safeUser } = user as any;
    return safeUser;
  }
}
