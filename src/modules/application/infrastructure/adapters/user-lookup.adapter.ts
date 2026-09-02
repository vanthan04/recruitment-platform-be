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

    return {
      id: user.id,
      fullName: user.profile?.fullName ?? user.email,
      avatarUrl: user.profile?.avatarUrl ?? null,
    };
  }
}
