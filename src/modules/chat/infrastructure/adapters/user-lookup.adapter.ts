import { Injectable } from '@nestjs/common';
import {
  IChatUserLookupPort,
  ChatUserLookupResult,
} from '@/modules/chat/application/ports/user-lookup.port';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';

@Injectable()
export class ChatUserLookupAdapter implements IChatUserLookupPort {
  constructor(private readonly userRepository: IUserRepository) {}

  async findById(userId: string): Promise<ChatUserLookupResult | null> {
    const user = await this.userRepository.findByIdWithProfile(userId);
    if (!user) return null;

    return {
      id: user.id,
      fullName: user.profile?.fullName ?? user.email,
      avatarUrl: user.profile?.avatarUrl ?? null,
      role: user.role,
    };
  }

  async findManyByIds(
    userIds: string[],
  ): Promise<Map<string, ChatUserLookupResult>> {
    const users = await this.userRepository.findManyByIdsWithProfile([
      ...new Set(userIds),
    ]);
    return new Map(
      users.map((user) => [
        user.id,
        {
          id: user.id,
          fullName: user.profile?.fullName ?? user.email,
          avatarUrl: user.profile?.avatarUrl ?? null,
          role: user.role,
        },
      ]),
    );
  }
}
