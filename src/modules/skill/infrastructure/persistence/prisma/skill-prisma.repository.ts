import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';

@Injectable()
export class SkillPrismaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.skill.findUnique({ where: { id } });
  }

  async existsBySlug(slug: string): Promise<boolean> {
    const skill = await this.prisma.skill.findUnique({
      where: { slug },
      select: { id: true },
    });
    return !!skill;
  }

  async findAll() {
    return this.prisma.skill.findMany({ orderBy: { name: 'asc' } });
  }

  async create(data: any) {
    return this.prisma.skill.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.skill.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.skill.delete({ where: { id } });
  }
}
