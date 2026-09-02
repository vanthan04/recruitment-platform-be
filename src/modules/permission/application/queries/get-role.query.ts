import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { EntityNotFoundException } from '@/common/exceptions/domain.exception';

export class GetRoleQuery {
  constructor(public readonly roleId: string) {}
}

@Injectable()
@QueryHandler(GetRoleQuery)
export class GetRoleHandler implements IQueryHandler<GetRoleQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute({ roleId }: GetRoleQuery) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new EntityNotFoundException('Role', roleId);
    return role;
  }
}
