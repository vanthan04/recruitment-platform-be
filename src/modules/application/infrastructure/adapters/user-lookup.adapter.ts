import { Injectable } from '@nestjs/common';
import {
  IApplicationUserLookupPort,
  ApplicationUserLookupResult,
} from '@/modules/application/application/ports/user-lookup.port';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';

@Injectable()
export class ApplicationUserLookupAdapter implements IApplicationUserLookupPort {
  constructor(private readonly userRepository: IUserRepository) {}

  async findById(userId: string): Promise<ApplicationUserLookupResult | null> {
    const user = await this.userRepository.findByIdWithProfile(userId);
    if (!user) return null;

    return this.toResult(user);
  }

  async findManyByIds(
    userIds: string[],
  ): Promise<Map<string, ApplicationUserLookupResult>> {
    const uniqueIds = [...new Set(userIds)];
    const users = await this.userRepository.findManyByIdsWithProfile(uniqueIds);

    const results = new Map<string, ApplicationUserLookupResult>();
    for (const user of users) {
      results.set(user.id, this.toResult(user));
    }
    return results;
  }

  private toResult(user: {
    id: string;
    email: string;
    profile?: { fullName?: string; avatarUrl?: string | null };
  }): ApplicationUserLookupResult {
    return {
      id: user.id,
      fullName: user.profile?.fullName ?? user.email,
      avatarUrl: user.profile?.avatarUrl ?? null,
    };
  }
}
