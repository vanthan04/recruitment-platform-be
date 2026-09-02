import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '@/common/decorators/require-permissions.decorator';
import { Permission } from '@/common/enums/permission.enum';
import { PermissionsService } from '@/modules/permission/application/permissions.service';

// Authorization step of the flow: JwtAuthGuard -> request.user -> PermissionGuard.
// The permission(s) an endpoint requires come from @RequirePermissions(); whether
// the authenticated user's role actually grants them is resolved from
// User -> Role -> RolePermission -> Permission in the database (via
// PermissionsService), never from a hard-coded role->permission map.
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new UnauthorizedException();
    }

    const grantedPermissions =
      await this.permissionsService.getPermissionsForRole(user.role);
    const hasAllRequired = requiredPermissions.every((permission) =>
      grantedPermissions.has(permission),
    );

    if (!hasAllRequired) {
      throw new ForbiddenException(
        'You do not have permission to perform this action',
      );
    }

    return true;
  }
}
