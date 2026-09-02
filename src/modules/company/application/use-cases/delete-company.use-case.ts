import { Injectable } from '@nestjs/common';
import { ICompanyRepository } from '@/modules/company/domain/repositories/company.repository';
import { EntityNotFoundException } from '@/common/exceptions/domain.exception';

@Injectable()
export class DeleteCompanyUseCase {
  constructor(private readonly companyRepository: ICompanyRepository) {}

  async execute(ownerId: string, companyId: string): Promise<void> {
    const company = await this.companyRepository.findById(companyId);
    if (!company) {
      throw new EntityNotFoundException('Company', companyId);
    }

    company.ensureOwner(ownerId);
    company.softDelete();

    await this.companyRepository.update(company);
  }
}
