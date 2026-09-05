import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';

@Injectable()
export class RolePrismaRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.role.findMany({ orderBy: { name: 'asc' } });
  }

  findById(id: string) {
    return this.prisma.role.findUnique({ where: { id } });
  }

  findByNameWithPermissions(name: string) {
    return this.prisma.role.findUnique({
      where: { name },
      include: { rolePermissions: { include: { permission: true } } },
    });
  }

  findByIdWithPermissions(id: string) {
    return this.prisma.role.findUnique({
      where: { id },
      include: { rolePermissions: { include: { permission: true } } },
    });
  }

  async roleGrantsPermissionId(
    roleId: string,
    permissionId: string,
  ): Promise<boolean> {
    const row = await this.prisma.rolePermission.findUnique({
      where: { roleId_permissionId: { roleId, permissionId } },
    });
    return !!row;
  }

  countOtherRolesGrantingPermissionId(
    permissionId: string,
    excludingRoleId: string,
  ) {
    return this.prisma.rolePermission.count({
      where: { permissionId, roleId: { not: excludingRoleId } },
    });
  }

  async replacePermissions(
    roleId: string,
    permissionIds: string[],
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId } }),
      this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
      }),
    ]);
  }
}
