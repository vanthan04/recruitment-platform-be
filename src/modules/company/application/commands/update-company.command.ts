import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ICompanyRepository } from '@/modules/company/domain/repositories/company.repository';
import { CompanySize } from '@/modules/company/domain/value-objects/company-size.vo';
import { CompanyNotFoundException } from '@/modules/company/domain/exceptions/company.exceptions';
import { CompanyResponseMapper } from '@/modules/company/application/mappers/company-response.mapper';
import { CompanyResponseDto } from '@/modules/company/application/dto/company-response.dto';

export interface UpdateCompanyInput {
  name?: string;
  logoUrl?: string;
  description?: string;
  website?: string;
  size?: CompanySize;
  address?: string;
}

export class UpdateCompanyCommand {
  constructor(
    public readonly ownerId: string,
    public readonly companyId: string,
    public readonly input: UpdateCompanyInput,
  ) {}
}

@Injectable()
@CommandHandler(UpdateCompanyCommand)
export class UpdateCompanyHandler implements ICommandHandler<
  UpdateCompanyCommand,
  CompanyResponseDto
> {
  constructor(private readonly companyRepository: ICompanyRepository) {}

  async execute({
    ownerId,
    companyId,
    input,
  }: UpdateCompanyCommand): Promise<CompanyResponseDto> {
    const company = await this.companyRepository.findById(companyId);
    if (!company) {
      throw new CompanyNotFoundException(companyId);
    }

    company.ensureOwner(ownerId);
    company.updateDetails(input);

    const updated = await this.companyRepository.update(company);
    return CompanyResponseMapper.toDto(updated);
  }
}
