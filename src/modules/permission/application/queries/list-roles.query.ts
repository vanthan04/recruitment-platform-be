import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '@/modules/prisma/prisma.service';

export class ListRolesQuery {}

@Injectable()
@QueryHandler(ListRolesQuery)
export class ListRolesHandler implements IQueryHandler<ListRolesQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute() {
    return this.prisma.role.findMany({ orderBy: { name: 'asc' } });
  }
}
