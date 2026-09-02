import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { EntityNotFoundException } from '@/common/exceptions/domain.exception';

export class GetRolePermissionsQuery {
  constructor(public readonly roleId: string) {}
}

@Injectable()
@QueryHandler(GetRolePermissionsQuery)
export class GetRolePermissionsHandler implements IQueryHandler<GetRolePermissionsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute({ roleId }: GetRolePermissionsQuery) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: { rolePermissions: { include: { permission: true } } },
    });
    if (!role) throw new EntityNotFoundException('Role', roleId);

    return role.rolePermissions.map((rp) => rp.permission);
  }
}
