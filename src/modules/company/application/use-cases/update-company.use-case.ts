import { Injectable } from '@nestjs/common';
import { ICompanyRepository } from '@/modules/company/domain/repositories/company.repository';
import { CompanySize } from '@/modules/company/domain/value-objects/company-size.vo';
import { EntityNotFoundException } from '@/common/exceptions/domain.exception';
import { CompanyResponseMapper } from '@/modules/company/application/mappers/company-response.mapper';
import { CompanyResponseDto } from '@/modules/company/application/dto/company-response.dto';

export interface UpdateCompanyInput {
  name?: string;
  logoUrl?: string;
  description?: string;
  website?: string;
  industry?: string;
  size?: CompanySize;
  address?: string;
}

@Injectable()
export class UpdateCompanyUseCase {
  constructor(private readonly companyRepository: ICompanyRepository) {}

  async execute(
    ownerId: string,
    companyId: string,
    input: UpdateCompanyInput,
  ): Promise<CompanyResponseDto> {
    const company = await this.companyRepository.findById(companyId);
    if (!company) {
      throw new EntityNotFoundException('Company', companyId);
    }

    company.ensureOwner(ownerId);
    company.updateDetails(input);

    const updated = await this.companyRepository.update(company);
    return CompanyResponseMapper.toDto(updated);
  }
}
