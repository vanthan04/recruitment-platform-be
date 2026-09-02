import { Injectable } from '@nestjs/common';
import { ICompanyRepository } from '@/modules/company/domain/repositories/company.repository';
import { Company } from '@/modules/company/domain/entities/company.entity';
import { CompanySize } from '@/modules/company/domain/value-objects/company-size.vo';
import { IUserRepository } from '@/modules/user/domain/repositories/user.repository';
import { DuplicateEntityException } from '@/common/exceptions/domain.exception';
import { CompanyResponseMapper } from '@/modules/company/application/mappers/company-response.mapper';
import { CompanyResponseDto } from '@/modules/company/application/dto/company-response.dto';

export interface CreateCompanyInput {
  name: string;
  logoUrl?: string;
  description?: string;
  website?: string;
  industry?: string;
  size?: CompanySize;
  address?: string;
}

@Injectable()
export class CreateCompanyUseCase {
  constructor(
    private readonly companyRepository: ICompanyRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(ownerId: string, input: CreateCompanyInput): Promise<CompanyResponseDto> {
    const existing = await this.companyRepository.findByOwnerId(ownerId);
    if (existing) {
      throw new DuplicateEntityException('Company', 'owner');
    }

    const slug = await this.generateUniqueSlug(input.name);

    const company = new Company({
      name: input.name,
      slug,
      logoUrl: input.logoUrl ?? null,
      description: input.description ?? null,
      website: input.website ?? null,
      industry: input.industry ?? null,
      size: input.size ?? null,
      address: input.address ?? null,
      ownerId,
    });

    const saved = await this.companyRepository.save(company);
    await this.userRepository.updateCompanyId(ownerId, saved.id);

    return CompanyResponseMapper.toDto(saved);
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let slug = base;
    let suffix = 1;
    while (await this.companyRepository.existsBySlug(slug)) {
      slug = `${base}-${++suffix}`;
    }
    return slug;
  }
}
