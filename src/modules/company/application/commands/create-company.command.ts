import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ICompanyRepository } from '@/modules/company/domain/repositories/company.repository';
import { Company } from '@/modules/company/domain/entities/company.entity';
import { CompanySize } from '@/modules/company/domain/value-objects/company-size.vo';
import { CompanyType } from '@/modules/company/domain/value-objects/company-type.vo';
import { CompanyAlreadyExistsException } from '@/modules/company/domain/exceptions/company.exceptions';
import { CompanyResponseMapper } from '@/modules/company/application/mappers/company-response.mapper';
import { CompanyResponseDto } from '@/modules/company/application/dto/company-response.dto';

export interface CreateCompanyInput {
  name: string;
  logoUrl?: string;
  description?: string;
  website?: string;
  size?: CompanySize;
  companyType?: CompanyType;
  address?: string;
  province?: string;
  ward?: string;
}

export class CreateCompanyCommand {
  constructor(
    public readonly ownerId: string,
    public readonly input: CreateCompanyInput,
  ) {}
}

@Injectable()
@CommandHandler(CreateCompanyCommand)
export class CreateCompanyHandler implements ICommandHandler<
  CreateCompanyCommand,
  CompanyResponseDto
> {
  constructor(private readonly companyRepository: ICompanyRepository) {}

  async execute({
    ownerId,
    input,
  }: CreateCompanyCommand): Promise<CompanyResponseDto> {
    const existing = await this.companyRepository.findByOwnerId(ownerId);
    if (existing) {
      throw new CompanyAlreadyExistsException();
    }

    const slug = await this.generateUniqueSlug(input.name);

    const company = new Company({
      name: input.name,
      slug,
      logoUrl: input.logoUrl ?? null,
      description: input.description ?? null,
      website: input.website ?? null,
      size: input.size ?? null,
      companyType: input.companyType ?? null,
      address: input.address ?? null,
      province: input.province ?? null,
      ward: input.ward ?? null,
      ownerId,
    });

    const saved = await this.companyRepository.saveWithOwnerLink(company);

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
