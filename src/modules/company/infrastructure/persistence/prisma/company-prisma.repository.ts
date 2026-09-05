import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CompanyPrismaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.company.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.company.findFirst({
      where: { slug, deletedAt: null },
    });
  }

  async findByOwnerId(ownerId: string) {
    return this.prisma.company.findFirst({
      where: { ownerId, deletedAt: null },
    });
  }

  async findManyByIds(ids: string[]) {
    return this.prisma.company.findMany({
      where: { id: { in: ids }, deletedAt: null },
    });
  }

  async existsBySlug(slug: string): Promise<boolean> {
    const company = await this.prisma.company.findUnique({
      where: { slug },
      select: { id: true },
    });
    return !!company;
  }

  async findAllPaginated(params: {
    skip: number;
    take: number;
    where: Prisma.CompanyWhereInput;
  }) {
    const [companies, total] = await Promise.all([
      this.prisma.company.findMany({
        skip: params.skip,
        take: params.take,
        where: params.where,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.company.count({ where: params.where }),
    ]);

    return { companies, total };
  }

  async create(data: any) {
    return this.prisma.company.create({ data });
  }

  /**
   * Creates the company and links it to its owner (`User.companyId` — what
   * job-creation eligibility actually checks, not `Company.ownerId`) in one
   * transaction. Without this, a failure between the two writes can leave a
   * recruiter owning a Company row with no `companyId` on their own User
   * row — unable to post jobs, and unable to retry `POST /companies` either
   * since `findByOwnerId` would already find the orphaned company.
   */
  async createWithOwnerLink(data: any, ownerId: string) {
    return this.prisma.$transaction(async (tx) => {
      const company = await tx.company.create({ data });
      await tx.user.update({
        where: { id: ownerId },
        data: { companyId: company.id },
      });
      return company;
    });
  }

  async update(id: string, data: any) {
    return this.prisma.company.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.company.delete({ where: { id } });
  }
}
