import { Injectable } from '@nestjs/common';
import { IUserLookupPort, UserEmailLookupResult } from '@/modules/job-alert/application/ports/user-lookup.port';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';

@Injectable()
export class UserLookupAdapter implements IUserLookupPort {
  constructor(private readonly userRepository: IUserRepository) {}

  async findById(userId: string): Promise<UserEmailLookupResult | null> {
    const user = await this.userRepository.findById(userId);
    if (!user) return null;
    return { email: user.email };
  }
}
