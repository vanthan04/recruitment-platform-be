import { Injectable } from '@nestjs/common';
import { IUserLookupPort } from '@/modules/job/application/ports/user-lookup.port';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';

@Injectable()
export class UserLookupAdapter implements IUserLookupPort {
  constructor(private readonly userRepository: IUserRepository) {}

  async getRecruiterCompanyId(userId: string): Promise<string | null> {
    const user = await this.userRepository.findById(userId);
    return user?.companyId ?? null;
  }
}
