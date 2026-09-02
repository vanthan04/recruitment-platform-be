import { Injectable } from '@nestjs/common';
import { IUserCompanyLinkPort } from '@/modules/company/application/ports/user-company-link.port';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';

@Injectable()
export class UserCompanyLinkAdapter implements IUserCompanyLinkPort {
  constructor(private readonly userRepository: IUserRepository) {}

  async updateCompanyId(userId: string, companyId: string): Promise<void> {
    await this.userRepository.updateCompanyId(userId, companyId);
  }
}
