import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '@/modules/prisma/prisma.service';

export class ListPermissionsQuery {}

@Injectable()
@QueryHandler(ListPermissionsQuery)
export class ListPermissionsHandler implements IQueryHandler<ListPermissionsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute() {
    return this.prisma.permission.findMany({ orderBy: { name: 'asc' } });
  }
}
