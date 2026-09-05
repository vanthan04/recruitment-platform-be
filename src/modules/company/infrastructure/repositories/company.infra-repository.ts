import { Injectable } from '@nestjs/common';
import { ICompanyRepository } from '@/modules/company/domain/repositories/company.repository';
import { Company } from '@/modules/company/domain/entities/company.entity';
import { CompanyPrismaRepository } from '@/modules/company/infrastructure/persistence/prisma/company-prisma.repository';
import { CompanyMapper } from '@/modules/company/infrastructure/persistence/mappers/company.mapper';
import { normalizePagination } from '@/common/utils/pagination.util';
import { Prisma } from '@prisma/client';

@Injectable()
export class CompanyInfraRepository implements ICompanyRepository {
  constructor(private readonly companyPrisma: CompanyPrismaRepository) {}

  async findById(id: string): Promise<Company | null> {
    const raw = await this.companyPrisma.findById(id);
    return CompanyMapper.toDomain(raw);
  }

  async findBySlug(slug: string): Promise<Company | null> {
    const raw = await this.companyPrisma.findBySlug(slug);
    return CompanyMapper.toDomain(raw);
  }

  async findByOwnerId(ownerId: string): Promise<Company | null> {
    const raw = await this.companyPrisma.findByOwnerId(ownerId);
    return CompanyMapper.toDomain(raw);
  }

  async existsBySlug(slug: string): Promise<boolean> {
    return this.companyPrisma.existsBySlug(slug);
  }

  async findAllPaginated(params: {
    page: number;
    limit: number;
    keyword?: string;
  }): Promise<{ companies: Company[]; total: number }> {
    const { skip, limit } = normalizePagination(params);
    const where: Prisma.CompanyWhereInput = { deletedAt: null };

    if (params.keyword) {
      where.name = { contains: params.keyword, mode: 'insensitive' };
    }

    const { companies: raws, total } =
      await this.companyPrisma.findAllPaginated({
        skip,
        take: limit,
        where,
      });

    return {
      companies: raws.map((r) => CompanyMapper.toDomain(r)!),
      total,
    };
  }

  async save(company: Company): Promise<Company> {
    const data = CompanyMapper.toPersistence(company);
    const raw = await this.companyPrisma.create(data);
    return CompanyMapper.toDomain(raw)!;
  }

  async update(company: Company): Promise<Company> {
    const data = CompanyMapper.toPersistence(company);
    const raw = await this.companyPrisma.update(company.id, data);
    return CompanyMapper.toDomain(raw)!;
  }

  async delete(id: string): Promise<void> {
    await this.companyPrisma.delete(id);
  }
}
